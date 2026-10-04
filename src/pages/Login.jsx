import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from '@mantine/form';
import {
  Alert, Anchor, Button, Center, Paper, PasswordInput,
  Stack, Text, TextInput, Title,
} from '@mantine/core';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const form = useForm({
    mode: 'controlled',
    initialValues: { username: '', password: '' },
    validate: {
      username: (v) => (v.trim() ? null : 'Username is required'),
      password: (v) => (v ? null : 'Password is required'),
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = form.onSubmit(async (values) => {
    setError('');
    setSubmitting(true);
    const res = await login(values.username, values.password);
    setSubmitting(false);
    if (res.ok) navigate('/', { replace: true });
    else setError(res.error);
  });

  return (
    <Center mih="100vh" p="md">
      <Paper component="form" onSubmit={handleSubmit} shadow="md" radius="md" p="xl" w={380} withBorder>
        <Stack gap="md">
          <div>
            <Title order={2}>Sign In</Title>
            <Text c="dimmed" size="sm">GST Tax Invoice Generator</Text>
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
            placeholder="Your password"
            {...form.getInputProps('password')}
          />

          <Button type="submit" fullWidth loading={submitting}>Login</Button>

          <Text size="sm" ta="center" c="dimmed">
            Don&apos;t have an account?{' '}
            <Anchor component={Link} to="/signup">Create one</Anchor>
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
