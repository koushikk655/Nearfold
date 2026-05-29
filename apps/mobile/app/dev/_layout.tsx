// /dev layout — gated behind __DEV__ so the gallery is unreachable in
// production builds. We can't fully strip the route at bundle time without
// a babel transform, but the runtime redirect makes the screen inaccessible
// (any direct link resolves to /).

import { Redirect, Stack } from 'expo-router';

export default function DevLayout() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
