import {
  stoplossValue,
  targetValue,
  enableTarget,
  enableStoploss,
  positionLTPs,
  stoplosses,
  targets,
  trailingStoplosses,
  tslHitPositions,
  flatTradePositionBook,
  shoonyaPositionBook,
  toastMessage,
  showToast
} from '@/stores/globalStore'

// Order Management Composables
import { placeOrderForPosition } from '@/composables/useOrderManagement'

export const setStoploss = (position, type) => {
  if (!enableStoploss.value) {
    console.log('Stoploss is disabled.')
    return
  }
  const quantity = Math.abs(Number(position.netQty || position.netqty))

  if (quantity === 0) {
    console.log(`Quantity is zero for ${position.tsym}, no stoploss will be set.`)
    return
  }

  const ltp = parseFloat(positionLTPs.value[position.tsym])
  if (isNaN(ltp)) {
    console.error(`Invalid LTP for ${position.tsym}: ${positionLTPs.value[position.tsym]}`)
    console.log('Using fallback LTP from position data')
    // Try to get LTP from position data as fallback
    const fallbackLtp = parseFloat(position.lp || position.avgPrice || position.prc)
    if (isNaN(fallbackLtp)) {
      console.error(`No valid LTP found for ${position.tsym}`)
      return
    }
    positionLTPs.value[position.tsym] = fallbackLtp
  }

  // Ensure we have a valid stoploss value
  const stoplossValueNum = parseFloat(stoplossValue.value)
  if (isNaN(stoplossValueNum) || stoplossValueNum <= 0) {
    console.error(`Invalid stoploss value: ${stoplossValue.value}, using default value of 10`)
    stoplossValue.value = 10
  }

  const isLongPosition = (position.netqty > 0 || position.netQty > 0)
  let stoplossPrice

  try {
    switch (type) {
      case 'trailing':
        stoplossPrice = isLongPosition ? ltp - stoplossValueNum : ltp + stoplossValueNum
        trailingStoplosses.value[position.tsym] = parseFloat(stoplossPrice.toFixed(2))
        stoplosses.value[position.tsym] = null
        console.log(`TSL set for ${position.tsym}: ${stoplossPrice.toFixed(2)}`)
        break
      case 'static':
        stoplossPrice = isLongPosition ? ltp - stoplossValueNum : ltp + stoplossValueNum
        stoplosses.value[position.tsym] = parseFloat(stoplossPrice.toFixed(2))
        trailingStoplosses.value[position.tsym] = null
        console.log(`SL set for ${position.tsym}: ${stoplossPrice.toFixed(2)}`)
        break
      case 'convert_to_tsl':
        const existingSL = stoplosses.value[position.tsym]
        if (existingSL !== null) {
          trailingStoplosses.value[position.tsym] = existingSL
          stoplosses.value[position.tsym] = null
          console.log(`Converted SL to TSL for ${position.tsym}: ${existingSL.toFixed(2)}`)
        } else {
          console.error(`No existing SL to convert for ${position.tsym}`)
          return
        }
        break
      case 'convert_to_sl':
        const existingTSL = trailingStoplosses.value[position.tsym]
        if (existingTSL !== null) {
          stoplosses.value[position.tsym] = existingTSL
          trailingStoplosses.value[position.tsym] = null
          console.log(`Converted TSL to SL for ${position.tsym}: ${existingTSL.toFixed(2)}`)
        } else {
          console.error(`No existing TSL to convert for ${position.tsym}`)
          return
        }
        break
      default:
        console.error(`Unknown stoploss type: ${type}`)
        return
    }
    tslHitPositions.delete(position.tsym)
  } catch (error) {
    console.error(`Error setting ${type} stoploss for ${position.tsym}:`, error)
  }
}
export const removeStoploss = (position) => {
  stoplosses.value[position.tsym] = null
  trailingStoplosses.value[position.tsym] = null
  tslHitPositions.delete(position.tsym)
}
export const increaseStoploss = (position) => {
  if (stoplosses.value[position.tsym] !== null) {
    stoplosses.value[position.tsym] = Number((stoplosses.value[position.tsym] + 0.5).toFixed(2))
  }
}

export const decreaseStoploss = (position) => {
  if (stoplosses.value[position.tsym] !== null) {
    stoplosses.value[position.tsym] = Number((stoplosses.value[position.tsym] - 0.5).toFixed(2))
  }
}
export const setTarget = (position) => {
  if (!enableTarget.value) {
    console.log('Target is disabled.')
    return
  }
  const quantity = Math.abs(Number(position.netQty || position.netqty))

  if (quantity === 0) {
    console.log(`Quantity is zero for ${position.tsym}, no target will be set.`)
    return
  }

  // Get LTP from position data
  let ltp = parseFloat(positionLTPs.value[position.tsym])
  if (isNaN(ltp)) {
    console.error(`Invalid LTP for ${position.tsym}: ${positionLTPs.value[position.tsym]}`)
    console.log('Using fallback LTP from position data')
    // Try to get LTP from position data as fallback
    const fallbackLtp = parseFloat(position.lp || position.avgPrice || position.prc)
    if (isNaN(fallbackLtp)) {
      console.error(`No valid LTP found for ${position.tsym}`)
      return
    }
    ltp = fallbackLtp
    positionLTPs.value[position.tsym] = fallbackLtp
  }

  // Ensure we have a valid target value
  if (isNaN(parseFloat(targetValue.value)) || parseFloat(targetValue.value) <= 0) {
    console.error(`Invalid target value: ${targetValue.value}, using default value of 50`)
    targetValue.value = 50
  }

  const isLongPosition = (position.netqty > 0 || position.netQty > 0)
  
  // Set target based on position direction
  targets.value[position.tsym] = Number(
    (isLongPosition ? 
      parseFloat(ltp) + parseFloat(targetValue.value) : 
      parseFloat(ltp) - parseFloat(targetValue.value)).toFixed(2)
  )

  console.log(`Target set for ${position.tsym}: LTP = ${ltp}, TargetValue = ${targetValue.value}, Target = ${targets.value[position.tsym]}`)
}
export const removeTarget = (position) => {
  targets.value[position.tsym] = null
}
export const increaseTarget = (position) => {
  if (targets.value[position.tsym] !== null) {
    targets.value[position.tsym] += 0.5 // Adjust increment value as needed
  }
}
export const decreaseTarget = (position) => {
  if (targets.value[position.tsym] !== null) {
    targets.value[position.tsym] -= 0.5 // Adjust decrement value as needed
  }
}

export const checkTargets = (newLTPs) => {
  if (!enableTarget.value) {
    // console.log('Target is disabled.');
    return
  }
  console.log('Checking targets...');
  const validTargets = Object.entries(targets.value).filter(
    ([tsym, target]) => target !== null && target !== undefined
  )

  if (validTargets.length === 0) {
    // console.log('No valid targets set. Skipping check.');
    return
  }

  for (const [tsym, target] of validTargets) {
    const currentLTP = parseFloat(positionLTPs.value[tsym])
    const position = [...flatTradePositionBook.value, ...shoonyaPositionBook.value].find(
      (p) => p.tsym === tsym
    )

    console.log(`Checking target for ${tsym}: Current LTP = ${currentLTP}, Target = ${target}`);
    if (position && !isNaN(currentLTP)) {
      const isLongPosition = (position.netqty > 0 || position.netQty > 0)
      const targetValue = parseFloat(target)
      
      if ((isLongPosition && currentLTP >= targetValue) || (!isLongPosition && currentLTP <= targetValue)) {
        console.log(`Target reached for ${tsym}. Placing order to close position.`)
        const transactionType = isLongPosition ? 'S' : 'B'
        placeOrderForPosition(
          transactionType,
          position.tsym.includes('C') ? 'CALL' : 'PUT',
          position
        )
        removeTarget(position)
        toastMessage.value = 'Target hit for ' + tsym
        showToast.value = true
      }
    }
  }
}
export const checkStoplosses = () => {
  if (!enableStoploss.value) {
    // console.log('Stoploss is disabled.');
    return
  }

  console.log('Checking stoplosses...')
  
  const stoplossValueNum = parseFloat(stoplossValue.value)
  if (isNaN(stoplossValueNum) || stoplossValueNum <= 0) {
    console.error(`Invalid stoploss value: ${stoplossValue.value}, using default value of 10`)
    stoplossValue.value = 10
  }

  // Check static stoplosses
  for (const [tsym, sl] of Object.entries(stoplosses.value)) {
    if (sl !== null && positionLTPs.value[tsym] !== undefined) {
      const position = [...flatTradePositionBook.value, ...shoonyaPositionBook.value].find(
        (p) => p.tsym === tsym
      )
      if (position) {
        const isLongPosition = (position.netqty > 0 || position.netQty > 0)
        const currentLTP = parseFloat(positionLTPs.value[tsym])
        const stopLossValue = parseFloat(sl)
        
        if (isNaN(currentLTP)) {
          console.error(`Invalid LTP for ${tsym}: ${positionLTPs.value[tsym]}`)
          continue
        }
        
        console.log(`Checking SL for ${tsym}: LTP ${currentLTP}, SL ${stopLossValue}, Position: ${isLongPosition ? 'Long' : 'Short'}`)
        
        if ((isLongPosition && currentLTP <= stopLossValue) || (!isLongPosition && currentLTP >= stopLossValue)) {
          console.log(`Static SL hit for ${tsym}: LTP ${currentLTP}, SL ${sl}`)
          placeOrderForPosition(
            isLongPosition ? 'S' : 'B',
            position.tsym.includes('C') ? 'CALL' : 'PUT',
            position
          )
          removeStoploss(position)
          toastMessage.value = 'Stoploss hit for ' + tsym
          showToast.value = true
        }
      }
    }
  }

  // Check trailing stoplosses
  for (const [tsym, tsl] of Object.entries(trailingStoplosses.value)) {
    if (tsl !== null && positionLTPs.value[tsym] !== undefined) {
      const position = [...flatTradePositionBook.value, ...shoonyaPositionBook.value].find(
        (p) => p.tsym === tsym
      )
      if (position) {
        const isLongPosition = (position.netqty > 0 || position.netQty > 0)
        const currentLTP = parseFloat(positionLTPs.value[tsym])
        const trailingStoplossValue = parseFloat(tsl)
        
        if (isNaN(currentLTP)) {
          console.error(`Invalid LTP for ${tsym}: ${positionLTPs.value[tsym]}`)
          continue
        }
        
        console.log(`Checking TSL for ${tsym}: LTP ${currentLTP}, TSL ${trailingStoplossValue}, Position: ${isLongPosition ? 'Long' : 'Short'}`)

        if (isLongPosition) {
          if (currentLTP > trailingStoplossValue + stoplossValueNum) {
            // Update TSL for long positions
            const newTSL = parseFloat((currentLTP - stoplossValueNum).toFixed(2))
            console.log(`Updating TSL for ${tsym} from ${trailingStoplossValue} to ${newTSL}`)
            trailingStoplosses.value[tsym] = newTSL
          } else if (currentLTP <= trailingStoplossValue && !tslHitPositions.has(tsym)) {
            // Hit TSL for long positions
            console.log(`TSL hit for ${tsym}: LTP ${currentLTP}, TSL ${trailingStoplossValue}`)
            placeOrderForPosition('S', position.tsym.includes('C') ? 'CALL' : 'PUT', position)
            removeStoploss(position)
            toastMessage.value = 'Trailing Stoploss hit for ' + tsym
            showToast.value = true
            tslHitPositions.add(tsym) // Mark TSL as hit
          }
        } else {
          if (currentLTP < trailingStoplossValue - stoplossValueNum) {
            // Update TSL for short positions
            const newTSL = parseFloat((currentLTP + stoplossValueNum).toFixed(2))
            console.log(`Updating TSL for ${tsym} from ${trailingStoplossValue} to ${newTSL}`)
            trailingStoplosses.value[tsym] = newTSL
          } else if (currentLTP >= trailingStoplossValue && !tslHitPositions.has(tsym)) {
            // Hit TSL for short positions
            console.log(`TSL hit for ${tsym}: LTP ${currentLTP}, TSL ${trailingStoplossValue}`)
            placeOrderForPosition('B', position.tsym.includes('C') ? 'CALL' : 'PUT', position)
            removeStoploss(position)
            toastMessage.value = 'Trailing Stoploss hit for ' + tsym
            showToast.value = true
            tslHitPositions.add(tsym) // Mark TSL as hit
          }
        }
      }
    }
  }
}
export const checkStoplossesAndTargets = () => {
  checkStoplosses()
  checkTargets()
}
