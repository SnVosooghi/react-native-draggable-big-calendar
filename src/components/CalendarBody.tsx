import dayjs from 'dayjs'
import * as React from 'react'
import { Platform, ScrollView, StyleSheet, View, ViewStyle } from 'react-native'

import { u } from '../commonStyles'
import { useNow } from '../hooks/useNow'
import { usePanResponder } from '../hooks/usePanResponder'
import { EventCellStyle, EventRenderer, HorizontalDirection, ICalendarEvent } from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import {
  calculatePosition,
  getCountOfEventsAtEvent,
  getOrderOfEvent,
  getRelativeTopInDay,
  hours,
  isToday,
  typedMemo,
} from '../utils'
import { CalendarEvent } from './CalendarEvent'
import { HourGuideCell } from './HourGuideCell'
import { HourGuideColumn } from './HourGuideColumn'
import { ResizeableEvent } from './ResizeableEvent'

const styles = StyleSheet.create({
  nowIndicator: {
    position: 'absolute',
    zIndex: 10000,
    height: 2,
    width: '100%',
  },
})

export var widthContext = React.createContext(400)

interface CalendarBodyProps<T> {
  cellHeight: number
  containerHeight: number
  dateRange: dayjs.Dayjs[]
  events: ICalendarEvent<T>[]
  scrollOffsetMinutes: number
  ampm: boolean
  showTime: boolean
  style: ViewStyle
  eventCellStyle?: EventCellStyle<T>
  hideNowIndicator?: boolean
  overlapOffset?: number
  onPressCell?: (date: Date) => void
  onPressEvent?: (event: ICalendarEvent<T>) => void
  onSwipeHorizontal?: (d: HorizontalDirection) => void
  renderEvent?: EventRenderer<T>
  moveCallBack: any
}

function _CalendarBody<T>({
  cellHeight,
  dateRange,
  onPressCell,
  events,
  onPressEvent,
  eventCellStyle,
  ampm,
  showTime,
  scrollOffsetMinutes,
  hideNowIndicator,
  overlapOffset,
  onSwipeHorizontal,
  renderEvent,
  moveCallBack,
}: CalendarBodyProps<T>) {
  const scrollView = React.useRef<ScrollView>(null)
  const { now } = useNow(!hideNowIndicator)
  const layoutProps = React.useRef({ x: 0, y: 0, width: 500, height: 1000 })
  const [calculatedWidth, setCalculatedWidth] = React.useState(400)
  const [chooserVisible, setChooserVisible] = React.useState(false)
  const [newEventCoordinate, setNewEventCoordinate] = React.useState({ x: 0, y: 0 })

  React.useEffect(() => {
    if (scrollView.current && scrollOffsetMinutes && Platform.OS !== 'ios') {
      // We add delay here to work correct on React Native
      // see: https://stackoverflow.com/questions/33208477/react-native-android-scrollview-scrollto-not-working
      setTimeout(
        () => {
          if (scrollView && scrollView.current) {
            scrollView.current.scrollTo({
              y: (cellHeight * scrollOffsetMinutes) / 60,
              animated: false,
            })
          }
        },
        Platform.OS === 'web' ? 0 : 10,
      )
    }
  }, [scrollView, scrollOffsetMinutes, cellHeight])

  const panResponder = usePanResponder({
    onSwipeHorizontal,
  })


  const onPressSelectedCell = (date: dayjs.Dayjs) => {
    const { x, y } = calculatePosition(date, dateRange, layoutProps.current)
    setNewEventCoordinate({ x, y })
    setChooserVisible(!chooserVisible)
  }
  const setViewOffset = (x: number, y: number, width: number, height: number) => {
    layoutProps.current = { x, y, width, height }
  }

  const _renderMappedEvent = (event: ICalendarEvent<T>) => (
    <CalendarEvent
      key={`${event.start}${event.title}${event.end}`}
      event={event}
      onPressEvent={onPressEvent}
      eventCellStyle={eventCellStyle}
      showTime={showTime}
      eventCount={getCountOfEventsAtEvent(event, events)}
      eventOrder={getOrderOfEvent(event, events)}
      overlapOffset={overlapOffset}
      renderEvent={renderEvent}
      ampm={ampm}
      moveCallBack={moveCallBack}
      events={events}
      dateRange={dateRange}
      cellWidth={calculatedWidth}
    />
  )

  const theme = useTheme()

  return (
    <widthContext.Provider value={calculatedWidth}>
      <ScrollView
        onLayout={(event) => {
          var { x, y, width, height } = event.nativeEvent.layout
          setViewOffset(x, y, width, height)
          setCalculatedWidth(width)
        }}
        ref={scrollView}
        scrollEventThrottle={32}
        style={{zIndex: -10}}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        contentOffset={Platform.OS === 'ios' ? { x: 0, y: scrollOffsetMinutes } : { x: 0, y: 0 }}
        alwaysBounceHorizontal={false}
        alwaysBounceVertical={false}
        bounces={false}
        scrollEnabled={!chooserVisible}
      >
        {dateRange.map((date) =>
          events
            .filter(({ start }) =>
              dayjs(start).isBetween(date.startOf('day'), date.endOf('day'), null, '[)'),
            )
            .map(_renderMappedEvent),
        )}
        {dateRange.map((date) =>
          events
            .filter(
              ({ start, end }) =>
                dayjs(start).isBefore(date.startOf('day')) &&
                dayjs(end).isBetween(date.startOf('day'), date.endOf('day'), null, '[)'),
            )
            .map((event) => ({
              ...event,
              start: dayjs(event.end).startOf('day'),
            }))
            .map(_renderMappedEvent),
        )}
        {dateRange.map((date) =>
          events
            .filter(
              ({ start, end }) =>
                dayjs(start).isBefore(date.startOf('day')) && dayjs(end).isAfter(date.endOf('day')),
            )
            .map((event) => ({
              ...event,
              start: dayjs(event.end).startOf('day'),
              end: dayjs(event.end).endOf('day'),
            }))
            .map(_renderMappedEvent),
        )}

        {/* new event*/}
        {chooserVisible && (
          <ResizeableEvent 
            height={1000 / 24} 
            newEventCoordinate={newEventCoordinate} 
            onPressCell={onPressCell}
            startDate = {dateRange[0]}
            setChooserVisible={setChooserVisible}/>
        )}

        <View
          style={[u['flex-1'], theme.isRTL ? u['flex-row-reverse'] : u['flex-row']]}
          {...panResponder.panHandlers}
        >
          <View style={[u['z-20'], u['w-50']]}>
            {hours.map((hour) => (
              <HourGuideColumn key={hour} cellHeight={cellHeight} hour={hour} ampm={ampm} />
            ))}
          </View>
          {dateRange.map((date) => (
            <View style={[u['flex-1']]} key={date.toString()}>
              {hours.map((hour) => (
                <HourGuideCell
                  key={hour}
                  cellHeight={cellHeight}
                  date={date}
                  hour={hour}
                  onPress={onPressSelectedCell}
                />
              ))}

              {isToday(date) && !hideNowIndicator && (
                <View
                  style={[
                    styles.nowIndicator,
                    { backgroundColor: theme.palette.nowIndicator },
                    { top: `${getRelativeTopInDay(now)}%` },
                  ]}
                >
                  <View
                    style={{
                      position: 'absolute',
                      width: 8,
                      height: 8,
                      borderRadius: 8,
                      backgroundColor: 'black',
                      marginTop: -3,
                      marginLeft: -3,
                    }}
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </widthContext.Provider>
  )
}

export const CalendarBody = typedMemo(_CalendarBody)
