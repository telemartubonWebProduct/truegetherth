import { signOut } from "@/lib/auth/actions";
import { inverseButton, secondaryButton } from "@/components/admin/styles";

export function SignOutButton({ onInk = false, className = "" }: { onInk?: boolean; className?: string }) {
  return (
    <form action={signOut} className={className}>
      <button type="submit" className={`${onInk ? inverseButton : secondaryButton} w-full`}>
        ออกจากระบบ
      </button>
    </form>
  );
}
