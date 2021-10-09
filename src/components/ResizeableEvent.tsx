import dayjs from 'dayjs'
import * as React from 'react'
import { Animated, PanResponder, TouchableOpacity, View } from 'react-native'

import { widthContext } from './CalendarBody'

export interface panType {
  x: any
  y: any
  setOffset: any
  flattenOffset: any
  setValue: any
}

export const ResizeableEvent = (props) => {
  var marginTop = props.newEventCoordinate.y
  const pan: panType = React.useRef(new Animated.ValueXY()).current
  const [state, setState] = React.useState({ height: props.height, top: marginTop })
  var cellWidth = React.useContext(widthContext)
  cellWidth = (cellWidth - 50) / 7
  var currentHeight = props.height
  var topHourDif = props.newEventCoordinate.y

  const panResponder = React.useRef(
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
        const xUnit = -cellWidth
        const xDif = gestureState.moveX - gestureState.x0
        const xUnits = Math.floor(xDif / xUnit + 0.5)

        const yUnit = 1000 / 24
        const yDif = gestureState.moveY - gestureState.y0
        var yUnits = Math.floor((4 * yDif) / yUnit + 0.5)
        yUnits = yUnits / 4

        pan.setValue({ x: xUnits * xUnit, y: yUnit * yUnits })
        pan.flattenOffset()
        // currentHeight = currentHeight + gestureState.moveY - gestureState.y0
        // const change = { day: xUnits, hour: yUnits, event: props.event }
        // props.moveCallBack(change)
        // console.log(xUnits * xUnit,yUnits)
      },
    }),
  ).current

  const bottomPanResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_e, gestureState) => {
        const moved = gestureState.moveY - gestureState.y0
        setState((state) => ({ ...state, height: currentHeight + moved }))
      },
      onPanResponderRelease: (_e, _gestureState) => {
        pan.flattenOffset()
        currentHeight = currentHeight + _gestureState.moveY - _gestureState.y0
      },
    }),
  ).current

  const topPanResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_e, gestureState) => {
        const moved = -(gestureState.moveY - gestureState.y0)
        setState((state) => ({ ...state, height: currentHeight + moved, top: marginTop - moved }))
      },
      onPanResponderRelease: (_e, _gestureState) => {
        pan.flattenOffset()
        const hoursDiffered = _gestureState.moveY - _gestureState.y0 + topHourDif
        topHourDif = hoursDiffered
        currentHeight = currentHeight - _gestureState.moveY + _gestureState.y0
        marginTop = marginTop + _gestureState.moveY - _gestureState.y0
      },
    }),
  ).current

  const eventPressed = React.useCallback(() => {
    calculateDate()
  }, [props.onPressCell])

  const calculateDate = () => {
    const lengthInHours = currentHeight / props.height
    const hourDif = ((pan.y._value + marginTop)/props.height ) 
    const dayDif = (pan.x._value + props.newEventCoordinate.x - 50) / cellWidth
    const generatedDate = dayjs(props.startDate)
      .hour(0)
      .minute(0)
      .second(0)
      .add(dayDif, 'days')
      .add(hourDif, 'hours')
      .subtract(dayjs(props.startDate).day() - 1, 'day')
    props.setChooserVisible(false)
    console.log(generatedDate, lengthInHours)
    props.onPressCell(generatedDate, lengthInHours)
  }

  return (
    <>
      <Animated.View
        style={{
          zIndex: 1001,
          borderTopLeftRadius: 5,
          borderTopRightRadius: 5,
          height: 10,
          width: cellWidth,
          borderColor: '#3771e0',
          borderWidth: 2,
          borderBottomWidth: 0,
          marginTop: state.top,
          position: 'absolute',
          marginLeft: props.newEventCoordinate.x,
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        }}
        {...topPanResponder.panHandlers}
      >
        <View
          style={{
            height: 7,
            width: 7,
            borderRadius: 7,
            marginTop: -4,
            left: '20%',
            backgroundColor: '#3771e0',
          }}
        />
      </Animated.View>
      <Animated.View
        style={{
          zIndex: 1000,
          height: state.height,
          width: cellWidth,
          marginTop: state.top,
          marginLeft: props.newEventCoordinate.x,
          borderColor: '#3771e0',
          borderRadius: 5,
          borderWidth: 2,
          position: 'absolute',
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        }}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={{ width: '100%', height: '100%' }} onPress={eventPressed} />
      </Animated.View>
      <Animated.View
        style={{
          zIndex: 1001,
          borderBottomLeftRadius: 5,
          borderBottomRightRadius: 5,
          height: 10,
          width: cellWidth,
          borderColor: '#3771e0',
          borderWidth: 2,
          borderTopWidth: 0,
          top: state.height - 10,
          marginTop: state.top,
          position: 'absolute',
          marginLeft: props.newEventCoordinate.x,
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        }}
        {...bottomPanResponder.panHandlers}
      >
        <View
          style={{
            height: 7,
            width: 7,
            borderRadius: 7,
            marginTop: 6,
            left: '80%',
            backgroundColor: '#3771e0',
          }}
        />
      </Animated.View>
    </>
  )
}
