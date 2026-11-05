import {TaskDetail} from '@/pages/tasks-detail';

export const instant = false;

interface Props {
   params: Promise<{id: string}>;
}

export default async function TaskDetailPage({params}: Props) {
   const {id} = await params;
   return <TaskDetail taskId={id} />;
}
