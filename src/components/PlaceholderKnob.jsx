import React from 'react';
import { Box, Center, Text, Stack } from '@mantine/core';

// Simple placeholder visual for a knob
function PlaceholderKnob({ label, valueDisplay }) {
  return (
    <Stack align="center" spacing={2}>
      <Text size="xs" color="dimmed" transform="uppercase" weight={500}>
        {label}
      </Text>
      <Center
        sx={(theme) => ({
          border: `2px solid ${theme.colors.gray[4]}`,
          borderRadius: '50%', // Make it round
          width: 50,
          height: 50,
          backgroundColor: theme.colors.gray[1],
          cursor: 'pointer', // Indicate interactivity later
          userSelect: 'none',
        })}
      >
        {/* Optional: Display a dummy value or indicator */}
        {/* <Text size="xs" weight={700}>{valueDisplay ?? '...'}</Text> */}
        <Box sx={{ width: 2, height: 15, backgroundColor: 'gray', transform: 'translateY(-5px)' }} /> {/* Simple indicator line */}
      </Center>
      {valueDisplay && (
         <Text size="xs" weight={500}>{valueDisplay}</Text>
      )}
    </Stack>
  );
}

export default PlaceholderKnob;