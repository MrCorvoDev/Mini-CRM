/**
 * Test runner for Supabase RLS and Status Transition Security
 * Usage:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... node supabase/tests/run_security_tests.mjs
 */

import {createClient} from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const MANAGER_EMAIL = process.env.TEST_MANAGER_EMAIL || 'manager@example.com';
const MANAGER_PASSWORD = process.env.TEST_MANAGER_PASSWORD;
const EXEC1_EMAIL = process.env.TEST_EXEC1_EMAIL || 'executor1@example.com';
const EXEC1_PASSWORD = process.env.TEST_EXEC1_PASSWORD;
const EXEC2_EMAIL = process.env.TEST_EXEC2_EMAIL || 'executor2@example.com';
const EXEC2_PASSWORD = process.env.TEST_EXEC2_PASSWORD;

async function createAuthClient(email, password) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {persistSession: false, autoRefreshToken: false},
  });
  const {data, error} = await client.auth.signInWithPassword({email, password});
  if (error) {
    throw new Error(`Failed to authenticate as ${email}: ${error.message}`);
  }
  return {client, user: data.user};
}

async function runTests() {
  console.log('🚀 Starting Mini-CRM Security Test Suite...\n');
  let passed = 0;
  let failed = 0;

  let manager, exec1, exec2;

  try {
    manager = await createAuthClient(MANAGER_EMAIL, MANAGER_PASSWORD);
    exec1 = await createAuthClient(EXEC1_EMAIL, EXEC1_PASSWORD);
    exec2 = await createAuthClient(EXEC2_EMAIL, EXEC2_PASSWORD);
    console.log('✓ Successfully authenticated test accounts (1 Manager, 2 Executors)\n');
  } catch (err) {
    console.error('⚠️ Could not sign in test users. Ensure test accounts exist in Supabase Auth:');
    console.error(`   - ${MANAGER_EMAIL}`);
    console.error(`   - ${EXEC1_EMAIL}`);
    console.error(`   - ${EXEC2_EMAIL}`);
    console.error(`   Error details: ${err.message}\n`);
    process.exit(1);
  }

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Reason: ${err.message}`);
      failed++;
    }
  }

  // ── TEST 1: Executor A cannot read tasks assigned to Executor B ───────────
  await test('Executor A cannot read tasks of Executor B', async () => {
    const {data, error} = await exec1.client
      .from('tasks')
      .select('id, title, assignee_id')
      .eq('assignee_id', exec2.user.id);

    if (error) throw error;
    if (data && data.length > 0) {
      throw new Error(`Executor 1 saw ${data.length} tasks of Executor 2 via RLS!`);
    }
  });

  // ── TEST 2: Executor cannot change task title/description/assignee ─────────
  await test('Executor cannot change title, description or assignee', async () => {
    const {data: myTasks} = await exec1.client
      .from('tasks')
      .select('id')
      .eq('assignee_id', exec1.user.id)
      .limit(1);

    if (!myTasks || myTasks.length === 0) {
      throw new Error('No task found for executor 1 to test update');
    }

    const {data, error} = await exec1.client
      .from('tasks')
      .update({title: 'Hacked Title'})
      .eq('id', myTasks[0].id)
      .select();

    if (error) return;
    if (data && data.length > 0) {
      throw new Error('Database allowed executor to modify task title!');
    }
  });

  // ── TEST 3a: Executor cannot transition on_review -> accepted ────────────
  await test('Executor cannot transition on_review -> accepted', async () => {
    const {data: onReviewTasks} = await manager.client
      .from('tasks')
      .select('id')
      .eq('status', 'on_review')
      .limit(1);

    if (!onReviewTasks || onReviewTasks.length === 0) {
      console.log('   (Skipped transition test: no task in on_review status)');
      return;
    }

    const taskId = onReviewTasks[0].id;
    const {error} = await exec1.client.rpc('change_task_status', {
      p_task_id: taskId,
      p_to_status: 'accepted',
    });

    if (!error) {
      throw new Error('Executor was allowed to accept a task!');
    }
  });

  // ── TEST 3b: Manager cannot jump from new -> accepted directly ───────────
  await test('Manager cannot perform invalid transition (new -> accepted)', async () => {
    const {data: newTasks} = await manager.client
      .from('tasks')
      .select('id')
      .eq('status', 'new')
      .limit(1);

    if (!newTasks || newTasks.length === 0) {
      console.log('   (Skipped transition test: no task in new status)');
      return;
    }

    const taskId = newTasks[0].id;
    const {error} = await manager.client.rpc('change_task_status', {
      p_task_id: taskId,
      p_to_status: 'accepted',
    });

    if (!error) {
      throw new Error('Manager was allowed to jump new -> accepted directly!');
    }
  });

  // ── TEST 4: on_review -> rework without comment is rejected ──────────────
  await test('on_review -> rework requires non-empty comment', async () => {
    const {data: onReviewTasks} = await manager.client
      .from('tasks')
      .select('id')
      .eq('status', 'on_review')
      .limit(1);

    if (!onReviewTasks || onReviewTasks.length === 0) {
      console.log('   (Skipped rework test: no task in on_review status)');
      return;
    }

    const taskId = onReviewTasks[0].id;
    const {error} = await manager.client.rpc('change_task_status', {
      p_task_id: taskId,
      p_to_status: 'rework',
      p_comment: '',
    });

    if (!error) {
      throw new Error('Database allowed on_review -> rework without comment!');
    }
  });

  // ── TEST 5: Direct INSERT/UPDATE/DELETE on task_history is rejected ───────
  await test('Direct INSERT into task_history is rejected by RLS', async () => {
    const {error} = await manager.client.from('task_history').insert({
      task_id: '00000000-0000-0000-0000-000000000001',
      changed_by: manager.user.id,
      to_status: 'accepted',
    });

    if (!error) {
      throw new Error('Database allowed direct INSERT into task_history!');
    }
  });

  await test('Direct DELETE from task_history is rejected by RLS', async () => {
    const {data, error} = await manager.client
      .from('task_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (error) return; // явный отказ — тест пройден
    if (data && data.length > 0) {
      throw new Error(`Удалено строк из task_history: ${data.length}`);
    }
  });


  // ── TEST 6a: Executor cannot create a task ───────────────────────────────
  await test('Executor cannot create a new task', async () => {
    const {error} = await exec1.client.from('tasks').insert({
      title: 'Hacked task by executor',
      site_id: '00000000-0000-0000-0000-000000000001',
      assignee_id: exec1.user.id,
      status: 'new',
      created_by: exec1.user.id,
    });

    if (!error) {
      throw new Error('Database allowed executor to INSERT a task!');
    }
  });

  // ── TEST 6b: Executor cannot change role in profiles ──────────────────────
  await test('Executor cannot update role in profiles table', async () => {
    const {data, error} = await exec1.client
      .from('profiles')
      .update({role: 'manager'})
      .eq('id', exec1.user.id)
      .select();

    if (error) return;
    if (data && data.length > 0) {
      throw new Error('Исполнитель изменил свою роль в profiles!');
    }
  });

  console.log(`\n========================================`);
  console.log(`Summary: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
