# KB App

Mobile application for professional guardianship, developed for IBBEN.

## Form Validation Components

### TextField

Reusable component for text fields with built-in validation and error display.

#### Usage:

```tsx
import { TextField } from "@/components/ui";

<TextField
  label="Email"
  name="email"
  control={control}
  error={errors.email}
  placeholder="Enter your email"
  keyboardType="email-address"
  autoCapitalize="none"
/>;
```

#### Props:

- `label` - Field label
- `name` - Field name for react-hook-form
- `control` - Control object from react-hook-form
- `error` - Error object from react-hook-form
- `placeholder` - Placeholder text
- `secureTextEntry` - Hide text (for passwords)
- `keyboardType` - Keyboard type
- `autoCapitalize` - Auto capitalization
- `multiline` - Multi-line input
- `numberOfLines` - Number of lines
- `textAlignVertical` - Vertical alignment
- `style` - Additional styles

### FormError

Component for displaying general form errors.

#### Usage:

```tsx
import { FormError } from "@/components/ui";

<FormError error={generalError} />;
```

#### Props:

- `error` - Error text (optional)

## Validation

The application uses Yup for form validation. Validation schemas support internationalization:

```tsx
const SignUpSchema = (t: any) =>
  yup.object().shape({
    name: yup.string().required(t("signup.errors.nameRequired")),
    email: yup
      .string()
      .email(t("signup.errors.emailInvalid"))
      .required(t("signup.errors.emailRequired")),
    password: yup
      .string()
      .required(t("signup.errors.passwordRequired"))
      .min(6, t("signup.errors.passwordMinLength")),
  });
```

## Installation and Setup

```bash
npm install
npm start
```

## Project Structure

- `app/components/ui/` - Reusable UI components
- `app/(auth)/` - Authentication screens
- `features/` - Application business logic
- `services/` - External services and API

## Running app

Start application - if Android emulator is started, then after running you should be able to choose "a" and app should start locally.

```bash
npx expo start
```

Before running make sure that application is build in development mode.

```bash
eas build --profile development --platform android
```

When app version is ok, update app.json file and build version for production.

```bash
eas build --profile production --platform all
```

To submit application after building production build:

```bash
eas submit --platform all
```
