// TextInput story — label / helper / error states, animated focus border,
// password toggle.

import { useState } from 'react';
import { View } from 'react-native';

import { TextInput } from '../../components';
import { Section, StoryFrame } from '../StoryFrame';

export function TextInputStory() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const phoneError =
    phone.length > 0 && !/^[+]?[\d\s]{10,15}$/.test(phone)
      ? 'Phone should be 10–15 digits.'
      : undefined;

  const passwordError =
    password.length > 0 && password.length < 6 ? 'Min 6 characters.' : undefined;

  return (
    <StoryFrame
      title="TextInput"
      description="Animated focus border on the UI thread (Reanimated). Built-in password toggle variant for OTP / login flows."
    >
      <Section label="With label & helper">
        <TextInput
          label="Your name"
          placeholder="Sneha"
          value={name}
          onChangeText={setName}
          helper="As it appears on your delivery."
        />
      </Section>

      <Section label="With error">
        <TextInput
          label="Phone"
          placeholder="+91 98xxxxxxxx"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          error={phoneError}
          helper={!phoneError ? 'We send a one-time code here.' : undefined}
        />
      </Section>

      <Section label="Password toggle">
        <TextInput
          label="Password"
          placeholder="•••••••"
          value={password}
          onChangeText={setPassword}
          passwordToggle
          error={passwordError}
        />
      </Section>

      <Section label="Disabled">
        <View>
          <TextInput
            label="Read-only"
            value="aunty.kitchen@nearfold"
            editable={false}
          />
        </View>
      </Section>
    </StoryFrame>
  );
}
