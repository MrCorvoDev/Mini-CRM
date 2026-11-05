import {SiteDetail} from '@/pages/sites-detail';

export const instant = false;

interface Props {
   params: Promise<{id: string}>;
}

export default async function SiteDetailPage({params}: Props) {
   const {id} = await params;
   return <SiteDetail siteId={id} />;
}
