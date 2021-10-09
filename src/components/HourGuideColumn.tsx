import * as React from 'react'
import { Text, View } from 'react-native'

import { u } from '../commonStyles'
import { useTheme } from '../theme/ThemeContext'

// import { formatHour } from '../utils'

interface HourGuideColumnProps {
  cellHeight: number
  hour: number
  ampm: boolean
}

const _HourGuideColumn = ({ cellHeight, hour }: HourGuideColumnProps) => {
  const theme = useTheme()
  const textStyle = React.useMemo(
    () => ({ fontSize: theme.typography.sm.fontSize, fontFamily: 'segoeui' }),
    [theme],
  )

  return (
    <View style={{ height: cellHeight }}>
      {hour != 0 && (
        <Text style={[textStyle, u['text-center'], u['mt--8'], { color: '#2E2E2E' }]}>
          {hour}:00
        </Text>
      )}
    </View>
  )
}

export const HourGuideColumn = React.memo(_HourGuideColumn, () => true)
