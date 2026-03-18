import { Card, CardContent, Typography, Box, IconButton, Tooltip } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { Meter, MeterReading } from '../types';
import { useAppStore } from '../stores/useAppStore';

interface ReadingsChartProps {
  readings: MeterReading[];
  meters: Meter[];
}

export default function ReadingsChart({ readings, meters }: ReadingsChartProps) {
  const { favoriteElements, toggleMeterFavorites } = useAppStore();

  // Group readings: meter_id → data_point → readings[]
  const meterGroups = readings.reduce((acc, reading) => {
    const meterId = String(reading.meter_id);
    if (!acc[meterId]) acc[meterId] = {};
    if (!acc[meterId][reading.data_point]) acc[meterId][reading.data_point] = [];
    acc[meterId][reading.data_point].push(reading);
    return acc;
  }, {} as Record<string, Record<string, MeterReading[]>>);

  // Sort meters: favorited first, then alphabetically by name
  const sortedMeterIds = Object.keys(meterGroups).sort((a, b) => {
    const aDataPoints = Object.keys(meterGroups[a]);
    const bDataPoints = Object.keys(meterGroups[b]);
    const aAllFav = aDataPoints.every((dp) => favoriteElements.includes(`${a}-${dp}`));
    const bAllFav = bDataPoints.every((dp) => favoriteElements.includes(`${b}-${dp}`));
    if (aAllFav && !bAllFav) return -1;
    if (!aAllFav && bAllFav) return 1;
    const aMeter = meters.find((m) => String(m.meter_id) === a);
    const bMeter = meters.find((m) => String(m.meter_id) === b);
    return (aMeter?.name ?? a).localeCompare(bMeter?.name ?? b);
  });

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Readings by Meter
        </Typography>

        {sortedMeterIds.map((meterId) => {
          const dpGroups = meterGroups[meterId];
          const dataPoints = Object.keys(dpGroups);
          const meter = meters.find((m) => String(m.meter_id) === meterId);
          const allFavorited = dataPoints.every((dp) =>
            favoriteElements.includes(`${meterId}-${dp}`)
          );

          return (
            <Box
              key={meterId}
              mb={3}
              sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: allFavorited ? 'warning.light' : 'divider',
                overflow: 'hidden',
                transition: 'border-color 0.2s ease',
              }}
            >
              {/* Meter header */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 2,
                  py: 1,
                  backgroundColor: allFavorited ? 'rgba(251, 188, 4, 0.08)' : 'background.default',
                  borderBottom: '1px solid',
                  borderColor: allFavorited ? 'warning.light' : 'divider',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  {meter?.name ?? meterId}
                </Typography>
                <Tooltip title={allFavorited ? 'Remove all from favorites' : 'Add all to favorites'}>
                  <IconButton
                    size="small"
                    onClick={() => toggleMeterFavorites(meterId, dataPoints)}
                    sx={{
                      color: allFavorited ? 'warning.main' : 'text.disabled',
                      '&:hover': { color: 'warning.main' },
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {allFavorited ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Data point sections */}
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {dataPoints.map((dataPoint) => {
                  const sortedReadings = [...dpGroups[dataPoint]]
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                    )
                    .slice(0, 10);
                  const isFav = favoriteElements.includes(`${meterId}-${dataPoint}`);

                  return (
                    <Box key={dataPoint}>
                      <Typography
                        variant="caption"
                        color={isFav ? 'warning.dark' : 'text.secondary'}
                        fontWeight={500}
                        sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}
                      >
                        {isFav && <StarIcon sx={{ fontSize: 12 }} />}
                        {dataPoint}
                      </Typography>
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                          gap: 1,
                        }}
                      >
                        {sortedReadings.map((reading) => (
                          <Box
                            key={reading.id}
                            sx={{
                              p: 1,
                              border: '1px solid',
                              borderColor: isFav ? 'warning.light' : 'divider',
                              borderRadius: 1,
                              backgroundColor: isFav
                                ? 'rgba(251, 188, 4, 0.04)'
                                : 'background.paper',
                            }}
                          >
                            <Typography variant="body2" fontWeight="bold">
                              {reading.value} {reading.unit || ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(reading.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}

        {sortedMeterIds.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No readings available
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
