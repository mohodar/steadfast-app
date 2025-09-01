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
        // Check if there's already a manually entered value in stoplosses
        // If there is, keep it instead of calculating a new one
        if (stoplosses.value[position.tsym] === null || stoplosses.value[position.tsym] === undefined) {
          stoplossPrice = isLongPosition ? ltp - stoplossValueNum : ltp + stoplossValueNum
          stoplosses.value[position.tsym] = parseFloat(stoplossPrice.toFixed(2))
          console.log(`SL set for ${position.tsym}: ${stoplossPrice.toFixed(2)}`)
        } else {
          // Keep the existing manually entered value
          console.log(`Keeping existing SL for ${position.tsym}: ${stoplosses.value[position.tsym]}`)
        }
        trailingStoplosses.value[position.tsym] = null
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
  if (stoplosses.value[position.tsym] !== null && stoplosses.value[position.tsym] !== undefined) {
    // Use the current value in the stoplosses object for this position
    // This ensures we increment from the manually entered value
    stoplosses.value[position.tsym] = Number((stoplosses.value[position.tsym] + 0.5).toFixed(2))
  }
}

export const decreaseStoploss = (position) => {
  if (stoplosses.value[position.tsym] !== null && stoplosses.value[position.tsym] !== undefined) {
    // Use the current value in the stoplosses object for this position
    // This ensures we decrement from the manually entered value
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

  // Check if there's already a manually entered value in targets
  // If there is, keep it instead of calculating a new one
  if (targets.value[position.tsym] !== null && targets.value[position.tsym] !== undefined) {
    console.log(`Keeping existing target for ${position.tsym}: ${targets.value[position.tsym]}`)
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
  if (targets.value[position.tsym] !== null && targets.value[position.tsym] !== undefined) {
    // Use the current value in the targets object for this position
    // This ensures we increment from the manually entered value
    targets.value[position.tsym] = Number((targets.value[position.tsym] + 0.5).toFixed(2))
  }
}
export const decreaseTarget = (position) => {
  if (targets.value[position.tsym] !== null && targets.value[position.tsym] !== undefined) {
    // Use the current value in the targets object for this position
    // This ensures we decrement from the manually entered value
    targets.value[position.tsym] = Number((targets.value[position.tsym] - 0.5).toFixed(2))
  }
}

// Original checkTargets function has been removed to fix duplicate declaration
// The updated version is defined below at line ~365
// Original checkStoplosses function has been removed to fix duplicate declaration
// The updated version is defined below at line ~340
// Keep track of positions that have been closed by stoploss or target in the current check cycle
let positionsClosedByStoploss = new Set();
let positionsClosedByTarget = new Set();

// Modified checkStoplosses to track positions closed by stoploss
export const checkStoplosses = () => {
  if (!enableStoploss.value) {
    // console.log('Stoploss is disabled.');
    return
  }
  console.log('Checking stoplosses...');
  
  // Note: positionsClosedByStoploss is now cleared in checkStoplossesAndTargets
  
  // Check static stoplosses
  const validStoplosses = Object.entries(stoplosses.value || {}).filter(
    ([tsym, sl]) => sl !== null && sl !== undefined && 
      !positionsClosedByTarget.has(tsym) && 
      !persistentClosedByStoploss.has(tsym) && 
      !persistentClosedByTarget.has(tsym)
  )

  if (validStoplosses.length === 0) {
    // console.log('No valid stoplosses set. Skipping check.');
    return
  }

  // Ensure we have a valid stoploss value for calculations
  const stoplossValueNum = parseFloat(stoplossValue.value)
  if (isNaN(stoplossValueNum) || stoplossValueNum <= 0) {
    console.error(`Invalid stoploss value: ${stoplossValue.value}, using default value of 10`)
    stoplossValue.value = 10
  }

  for (const [tsym, sl] of validStoplosses) {
    const currentLTP = parseFloat(positionLTPs.value[tsym])
    const position = [...flatTradePositionBook.value, ...shoonyaPositionBook.value].find(
      (p) => p.tsym === tsym
    )

    // If LTP is NaN, try to get a fallback value from position data
    if (position && isNaN(currentLTP)) {
      console.error(`Invalid LTP for ${tsym}: ${positionLTPs.value[tsym]}`)
      console.log('Using fallback LTP from position data')
      // Try to get LTP from position data as fallback
      const fallbackLtp = parseFloat(position.lp || position.avgPrice || position.prc)
      if (!isNaN(fallbackLtp)) {
        console.log(`Using fallback LTP for ${tsym}: ${fallbackLtp}`)
        positionLTPs.value[tsym] = fallbackLtp
        continue // Restart the check for this position in the next cycle with the updated LTP
      } else {
        console.error(`No valid LTP found for ${tsym}`)
        continue // Skip this position for now
      }
    }
    
    if (position && !isNaN(currentLTP)) {
      const isLongPosition = (position.netqty > 0 || position.netQty > 0)
      const stopLossValue = parseFloat(sl)
      
      if (isNaN(stopLossValue)) {
        console.error(`Invalid stoploss for ${tsym}: ${sl}`)
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
        
        // Add this position to the set of positions closed by stoploss
        positionsClosedByStoploss.add(tsym);
      }
    }
  }

  // Check trailing stoplosses
  for (const [tsym, tsl] of Object.entries(trailingStoplosses.value || {})) {
    // Skip positions that have been closed by target hits or are in persistent closed sets
    if (positionsClosedByTarget.has(tsym) || persistentClosedByStoploss.has(tsym) || persistentClosedByTarget.has(tsym)) {
      console.log(`Skipping TSL check for ${tsym} as it was already closed`)
      continue
    }
    
    if (tsl !== null && tsl !== undefined && positionLTPs.value[tsym] !== undefined) {
      const position = [...flatTradePositionBook.value, ...shoonyaPositionBook.value].find(
        (p) => p.tsym === tsym
      )
      if (position) {
        const isLongPosition = (position.netqty > 0 || position.netQty > 0)
        const currentLTP = parseFloat(positionLTPs.value[tsym])
        
        // If LTP is NaN, try to get a fallback value from position data
        if (isNaN(currentLTP)) {
          console.error(`Invalid LTP for ${tsym}: ${positionLTPs.value[tsym]}`)
          console.log('Using fallback LTP from position data')
          // Try to get LTP from position data as fallback
          const fallbackLtp = parseFloat(position.lp || position.avgPrice || position.prc)
          if (!isNaN(fallbackLtp)) {
            console.log(`Using fallback LTP for ${tsym}: ${fallbackLtp}`)
            positionLTPs.value[tsym] = fallbackLtp
            continue // Restart the check for this position in the next cycle with the updated LTP
          } else {
            console.error(`No valid LTP found for ${tsym}`)
            continue // Skip this position for now
          }
        }
        
        const trailingStoplossValue = parseFloat(tsl)
        
        if (isNaN(trailingStoplossValue)) {
          console.error(`Invalid trailing stoploss for ${tsym}: ${tsl}`)
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
            
            // Add this position to both temporary and persistent sets of positions closed by stoploss
            positionsClosedByStoploss.add(tsym);
            persistentClosedByStoploss.add(tsym);
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
            
            // Add this position to both temporary and persistent sets of positions closed by stoploss
            positionsClosedByStoploss.add(tsym);
            persistentClosedByStoploss.add(tsym);
          }
        }
      }
    }
  }
}

// Sets to persistently track closed positions across check cycles
const persistentClosedByStoploss = new Set();
const persistentClosedByTarget = new Set();

// Modified checkTargets to skip positions closed by stoploss and track positions closed by target
export const checkTargets = (newLTPs) => {
  if (!enableTarget.value) {
    // console.log('Target is disabled.');
    return
  }
  console.log('Checking targets...');
  
  // Note: positionsClosedByTarget is now cleared in checkStoplossesAndTargets
  
  const validTargets = Object.entries(targets.value || {}).filter(
    ([tsym, target]) => target !== null && target !== undefined && 
      !positionsClosedByStoploss.has(tsym) && 
      !persistentClosedByStoploss.has(tsym) && 
      !persistentClosedByTarget.has(tsym)
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
    
    // If LTP is NaN, try to get a fallback value from position data
    if (position && isNaN(currentLTP)) {
      console.error(`Invalid LTP for ${tsym}: ${positionLTPs.value[tsym]}`)
      console.log('Using fallback LTP from position data')
      // Try to get LTP from position data as fallback
      const fallbackLtp = parseFloat(position.lp || position.avgPrice || position.prc)
      if (!isNaN(fallbackLtp)) {
        console.log(`Using fallback LTP for ${tsym}: ${fallbackLtp}`)
        positionLTPs.value[tsym] = fallbackLtp
        continue // Restart the check for this position in the next cycle with the updated LTP
      } else {
        console.error(`No valid LTP found for ${tsym}`)
        continue // Skip this position for now
      }
    }
    
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
        
        // Add this position to both temporary and persistent sets of positions closed by target
        positionsClosedByTarget.add(tsym);
        persistentClosedByTarget.add(tsym);
      }
    }
  }
}

export const checkStoplossesAndTargets = () => {
  // Check if there are any open positions
  const allPositions = [...flatTradePositionBook.value, ...shoonyaPositionBook.value];
  const hasOpenPositions = allPositions.some(position => {
    const quantity = Math.abs(Number(position.netQty || position.netqty));
    return quantity > 0;
  });
  
  // Only proceed if there are open positions
  if (!hasOpenPositions) {
    // console.log('No open positions found. Skipping stoploss and target checks.');
    return;
  }
  
  // Clear both tracking sets at the beginning of each check cycle
  positionsClosedByStoploss.clear();
  positionsClosedByTarget.clear();
  
  // First check stoplosses, which will update positionsClosedByStoploss
  checkStoplosses()
  
  // Then check targets, which will skip positions in positionsClosedByStoploss
  // and update positionsClosedByTarget
  checkTargets()
}
