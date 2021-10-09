import dayjs from 'dayjs'
import moment from 'jalali-moment'
import * as React from 'react'
import { Text, TouchableOpacity, View, ViewStyle } from 'react-native'

import { eventCellCss, u } from '../commonStyles'
import { ICalendarEvent } from '../interfaces'
import { useTheme } from '../theme/ThemeContext'
import { getWidthOfAllDayInPercent, isToday, typedMemo } from '../utils'

export interface CalendarHeaderProps<T> {
  dateRange: dayjs.Dayjs[]
  cellHeight: number
  style: ViewStyle
  allDayEvents: ICalendarEvent<T>[]
  DayNumberContainerStyle: ViewStyle
  events: ICalendarEvent<T>[]
  onPressDateHeader?: (date: Date) => void
  onPressEvent?: (event: ICalendarEvent<T>) => void
}

function _CalendarHeader<T>({
  dateRange,
  cellHeight,
  style,
  allDayEvents,
  onPressDateHeader,
  DayNumberContainerStyle,
  events,
  onPressEvent = () => console.log('onPressEvent'),
}: CalendarHeaderProps<T>) {
  const _onPress = React.useCallback(
    (date: Date) => {
      onPressDateHeader && onPressDateHeader(date)
    },
    [onPressDateHeader],
  )

  const theme = useTheme()
  // const [showMore, setShowMore] = React.useState(false)

  const borderColor = { borderColor: theme.palette.gray['200'] }
  const primaryBg = { backgroundColor: theme.palette.primary.main }

  const appendZero = (hexaValue) => {
    while (hexaValue.length < 2) hexaValue = '0' + hexaValue
    return hexaValue
  }

  const calculateWeightedColor = (dayEvents) => {
    let totalDuration = 0
    let totalR = 0
    let totalG = 0
    let totalB = 0
    dayEvents.forEach((element) => {
      const r = parseInt(element.color.substring(0, 2), 16) * element.duration
      const g = parseInt(element.color.substring(2, 4), 16) * element.duration
      const b = parseInt(element.color.substring(4, 6), 16) * element.duration
      totalR = totalR + r
      totalG = totalG + g
      totalB = totalB + b
      totalDuration = totalDuration + element.duration
    })
    const meanR = Math.round(totalR / totalDuration)
    const meanG = Math.round(totalG / totalDuration)
    const meanB = Math.round(totalB / totalDuration)
    const weightedColor =
      '#' +
      appendZero(meanR.toString(16).toUpperCase()) +
      appendZero(meanG.toString(16).toUpperCase()) +
      appendZero(meanB.toString(16).toUpperCase())
    return weightedColor
  }

  const todayColor = (date, isTopDay) => {
    const todayEvents = events
      .filter(({ start }) =>
        dayjs(start).isBetween(date.startOf('day'), date.endOf('day'), null, '[)'),
      )
      .map((i) => {
        if (!(i && i.color)) i.color = '#FFFF00'
        return {
          color: i.color.substring(1, 7),
          duration: dayjs(i.end).diff(dayjs(i.start), 'hour', true),
        }
      })
    if (todayEvents.length == 0 && !isTopDay) return 'transparent'
    if (todayEvents.length == 0 && isTopDay) return '#2E2E2E'
    let weightedColor = calculateWeightedColor(todayEvents)
    return weightedColor
  }

  return (
    <View
      style={[
        u['border-b-2'],
        u['pt-2'],
        { backgroundColor: '#FAFAFA' },
        borderColor,
        theme.isRTL ? u['flex-row-reverse'] : u['flex-row'],
        style,
      ]}
    >
      <View style={[u['w-50'], u['items-center']]}>
        <Text style={[theme.typography.xs, u['mb-4']]}>Week</Text>
        <View style={[u['w-36'], u['h-36'], u['bordered'], u['justify-center'], u['items-center']]}>
          <Text style={[theme.typography.xl]}>
            {Math.ceil(parseInt(dayjs(dateRange[0]).format('DD')) / 7)}
          </Text>
        </View>
        <Text style={[theme.typography.xs, u['mt-6']]}>All day</Text>
      </View>
      {dateRange.map((date) => {
        const _isToday = isToday(date)
        return (
          <TouchableOpacity
            style={[u['flex-1'], u['pt-2'], u['mb-2']]}
            onPress={() => _onPress(date.toDate())}
            disabled={onPressDateHeader === undefined}
            key={date.toString()}
          >
            <View style={[u['justify-between'], { minHeight: cellHeight }]}>
              <Text
                style={[
                  theme.typography.xs,
                  u['text-center'],
                  u['mb-4'],
                  {
                    color: todayColor(date, true),
                    fontFamily: 'segoeui',
                    fontSize: 11,
                  },
                ]}
              >
                {date.format('ddd')[0]}
              </Text>
              <View
                style={
                  !_isToday
                    ? [
                        primaryBg,
                        u['h-36'],
                        u['w-36'],
                        u['rounded-full'],
                        u['items-center'],
                        u['justify-center'],
                        u['self-center'],
                        u['z-20'],
                        DayNumberContainerStyle,
                        { backgroundColor: todayColor(date, false) },
                      ]
                    : [
                        primaryBg,
                        u['h-36'],
                        u['w-36'],
                        u['pb-2'],
                        u['rounded-full'],
                        u['items-center'],
                        u['justify-center'],
                        u['self-center'],
                        u['z-20'],
                        {
                          borderWidth: 2.5,
                          borderColor: todayColor(date, false),
                          backgroundColor: 'transparent',
                        },
                      ]
                }
              >
                <Text
                  style={[
                    theme.typography.sm,
                    u['text-center'],
                    { fontFamily: 'segoeui', lineHeight: 13 },
                    //Platform.OS === 'web' && _isToday && u['mt-6'],
                  ]}
                >
                  {date.format('D')}
                </Text>
                <Text
                  style={[
                    theme.typography.xs,
                    u['text-center'],
                    { fontFamily: 'segoeui', lineHeight: 12 },
                    //Platform.OS === 'web' && _isToday && u['mt-6'],
                  ]}
                >
                  {moment(date.format('YYYY-M-D'), 'YYYY-M-D HH:mm:ss').locale('fa').format('D')}
                </Text>
              </View>
            </View>
            <View
              style={[{ borderColor: theme.palette.gray['200'] }, u['mt-2'], { minHeight: 20 }]}
            >
              {allDayEvents.map((event, index) => {
                if (!dayjs(event.start).isSame(date, 'day')) {
                  return null
                }
                if (index <= 2)
                  return (
                    <TouchableOpacity
                      style={[
                        eventCellCss.style,
                        primaryBg,
                        { width: getWidthOfAllDayInPercent(event.start, event.end) + '%' },
                      ]}
                      key={`${event.start}${event.title}`}
                      onPress={() => onPressEvent(event)}
                    >
                      <Text
                        style={{
                          fontSize: 8,
                          color: theme.palette.primary.contrastText,
                          fontFamily: 'segoeui',
                        }}
                      >
                        {event.title}
                      </Text>
                    </TouchableOpacity>
                  )
                else
                  return (
                    <TouchableOpacity
                      style={[
                        eventCellCss.style,
                        primaryBg,
                        { width: getWidthOfAllDayInPercent(event.start, event.end) + '%' },
                      ]}
                      key={`${event.start}${event.title}`}
                      onPress={() => onPressEvent(event)}
                    >
                      <Text
                        style={{
                          fontSize: 8,
                          color: theme.palette.primary.contrastText,
                          fontFamily: 'segoeui',
                        }}
                      >
                        {event.title}{index}
                      </Text>
                    </TouchableOpacity>
                  )
              })}
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export const CalendarHeader = typedMemo(_CalendarHeader)
