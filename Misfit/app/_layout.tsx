import { Stack } from "expo-router";

//This code hides the group (tabs) on top of the screen
export default function RootLayout() {
  return (
      <Stack>
        <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
        />
      </Stack>
  );
}

