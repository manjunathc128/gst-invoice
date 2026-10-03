import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from '@mantine/form';
import {
  Alert, Anchor, Button, Center, Paper, PasswordInput,
  Stack, Text, TextInput, Title,
} from '@mantine/core';
import { useAuth } from '../context/AuthContext.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const form = useForm({
    mode: 'controlled',
    initialValues: { username: '', password: '', confirmPassword: '' },
    validate: {
      username: (v) => (v.trim().length >= 3 ? null : 'Enter an email or name (min 3 chars)'),
      password: (v) => (v.length >= 6 ? null : 'Password must be at least 6 characters'),
      confirmPassword: (v, values) =>
        v === values.password ? null : 'Passwords do not match',
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    setError('');
    const res = signup(values.username, values.password);
    if (res.ok) navigate('/', { replace: true });
    else setError(res.error);
  });

  return (
    <Center mih="100vh" p="md">
      <Paper component="form" onSubmit={handleSubmit} shadow="md" radius="md" p="xl" w={380} withBorder>
        <Stack gap="md">
          <div>
            <Title order={2}>Create Account</Title>
            <Text c="dimmed" size="sm">Sign up to start generating invoices</Text>
          </div>

          {error && <Alert color="red" variant="light">{error}</Alert>}

          <TextInput
            label="Username"
            placeholder="Email or name"
            data-autofocus
            {...form.getInputProps('username')}
          />
          <PasswordInput
            label="Password"
            placeholder="At least 6 characters"
            {...form.getInputProps('password')}
          />
          <PasswordInput
            label="Confirm Password"
            placeholder="Re-enter password"
            {...form.getInputProps('confirmPassword')}
          />

          <Button type="submit" fullWidth>Sign Up</Button>

          <Text size="sm" ta="center" c="dimmed">
            Already have an account?{' '}
            <Anchor component={Link} to="/login">Sign in</Anchor>
          </Text>

          <Text size="xs" c="dimmed" ta="center">
            Demo only: accounts are stored in your browser and are not secure.
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
