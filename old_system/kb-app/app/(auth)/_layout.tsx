import { Tabs } from "expo-router";

export default function AuthLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Intro",
        }}
      />
      <Tabs.Screen
        name="sign-in"
        options={{
          title: "Login",
        }}
      />
      <Tabs.Screen
        name="sign-up"
        options={{
          title: "Sign Up",
        }}
      />
      <Tabs.Screen
        name="forgot-password"
        options={{
          title: "Forgot Password",
        }}
      />
      <Tabs.Screen
        name="reset-password"
        options={{
          title: "Reset Password",
        }}
      />
      <Tabs.Screen
        name="privacy-policy"
        options={{
          title: "Privacy Policy",
        }}
      />
    </Tabs>
  );
}
