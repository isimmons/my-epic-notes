import {
  redirect,
  type DataFunctionArgs,
  type MetaFunction,
} from '@remix-run/node';
import { Form } from '@remix-run/react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { SpamError } from 'remix-utils/honeypot/server';
import { Button, Input, Label } from '~/components/ui';
import { honeypot } from '~/utils/honeypot.server';

export async function action({ request }: DataFunctionArgs) {
  const formData = await request.formData();

  try {
    honeypot.check(formData);
  } catch (error) {
    if (error instanceof SpamError) {
      throw new Response('Form not submitted properly', { status: 400 });
    }
    throw error;
  }

  return redirect('/');
}

export default function SignupRoute() {
  return (
    <div className="container flex min-h-full flex-col justify-center pb-32 pt-20">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-h1">Welcome aboard!</h1>
          <p className="text-body-md text-muted-foreground">
            Please enter your details.
          </p>
        </div>
        <Form
          method="POST"
          className="mx-auto flex min-w-[368px] max-w-sm flex-col gap-4"
        >
          <HoneypotInputs />
          <div>
            <Label htmlFor="email-input">Email</Label>
            <Input autoFocus id="email-input" name="email" type="email" />
          </div>
          <Button className="w-full" type="submit">
            Create an account
          </Button>
        </Form>
      </div>
    </div>
  );
}

export const meta: MetaFunction = () => {
  return [{ title: 'Setup Epic Notes Account' }];
};
