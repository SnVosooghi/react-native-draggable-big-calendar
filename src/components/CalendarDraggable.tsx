import React, { useRef } from 'react'
import { Animated, PanResponder, StyleSheet } from 'react-native'

import { getCountOfEventsAtEvent, getOrderOfEvent } from '../utils'
import { widthContext } from './CalendarBody'

export interface panXY {
  _value: number
}
export interface currentType {
  x: any
  y: any
  setOffset: any
  flattenOffset: any
  setValue: any
}

export const Draggable = (props) => {
  const pan: currentType = useRef(new Animated.ValueXY()).current
  const cellWidth = React.useContext(widthContext)
  const cellHeight = 1000 / 24

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_e, _gestureState) => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        })
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_e, gestureState) => {
        const xUnit = (cellWidth - 50) / 7
        const xDif = gestureState.moveX - gestureState.x0
        const xUnits = Math.floor(xDif / xUnit + 0.5)

        const yUnit = cellHeight
        const yDif = gestureState.moveY - gestureState.y0
        var yUnits = Math.floor((4 * yDif) / yUnit + 0.5)
        yUnits = yUnits / 4

        pan.setValue({ x: xUnits * xUnit, y: yUnit * yUnits })
        pan.flattenOffset()
        const change = { day: xUnits, hour: yUnits, event: props.event }
        props.moveCallBack(change)
      },
    }),
  ).current

  const day = props.touchableOpacityProps.key.substring(0, 2)
  const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  const dayDif = days.indexOf(day)
  const marginLeftInPercent = dayDif * 14.28
  const minusLeft = dayDif * 7.14
  var widthCss = 0.1428 * cellWidth - 9.14
  var leftCellCss = (marginLeftInPercent * cellWidth) / 100 - minusLeft
  const numberOfThisTimeEvent = getCountOfEventsAtEvent(props.event, props.events)
  var marginLeftInCell =
    (getOrderOfEvent(props.event, props.events) * widthCss) / numberOfThisTimeEvent
  widthCss = widthCss / numberOfThisTimeEvent - 3

  if (Object.keys(props.dateRange).length == 1) {
    widthCss = widthCss * 7 + 28
    leftCellCss = 0
  }
  const isDone = props.event.task? JSON.parse(props.event.task).activity.status == 'Done' : false

  return (
    <Animated.View
      style={[
        (props.touchableOpacityProps && props.touchableOpacityProps.style) || styles.box,
        {
          marginLeft: leftCellCss + marginLeftInCell + 3,
          width: widthCss,
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
          backgroundColor: (isDone && 'transparent') ||props.event.color,
          borderWidth: (isDone && 1 ) || 0,
          borderStyle: (isDone && 'dashed') || 'solid',
          borderColor: '#2E2E2E',
          elevation: 0
        },
      ]}
      {...panResponder.panHandlers}
    >
      {props.children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleText: {
    fontSize: 14,
    lineHeight: 24,
    fontWeight: 'bold',
  },
  box: {
    height: 100,
    width: 100,
    backgroundColor: 'blue',
    borderRadius: 5,
  },
})
