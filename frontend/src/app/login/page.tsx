import LoginForm from "@/components/forms/LoginForm";
import { login } from "@/app/login/actions";

export default function SignIn() {
  return <LoginForm onSubmit={login} />;
}
