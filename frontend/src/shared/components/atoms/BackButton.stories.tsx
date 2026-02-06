import type { Meta, StoryObj } from '@storybook/react';
import { BackButton } from './BackButton';

const meta = {
  title: 'Atoms/BackButton',
  component: BackButton,
  tags: ['autodocs'],
  args: {
    onBack: () => {},
    onLogout: () => {},
  },
} satisfies Meta<typeof BackButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    hasPages: true,
  },
};

export const LogoutState: Story = {
  args: {
    hasPages: false,
  },
};
