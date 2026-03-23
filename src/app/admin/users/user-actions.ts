"use server";

import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createUserAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const role = formData.get('role') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const supabase = createAdminClient();

    // 1. Create the user in Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      }
    });

    if (authError) {
      return { error: authError.message };
    }

    if (authUser.user) {
      // 2. The profile creation is handled by a DB trigger, 
      // but we need to ensure the role is set correctly.
      // Default trigger might set 'influencer'.
      if (role && role !== 'influencer') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role, first_name: firstName, last_name: lastName })
          .eq('id', authUser.user.id);

        if (profileError) {
            console.error('Error updating profile role:', profileError);
            // We don't return error here because user was created successfully
        }
      }
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    console.error('Create user error:', err);
    return { error: err.message || 'An unexpected error occurred' };
  }
}
