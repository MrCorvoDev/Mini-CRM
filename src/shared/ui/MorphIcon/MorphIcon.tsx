import clsx from 'clsx';
import {MorphIcon as MorphIconComponent} from 'morphicons/react';

interface Props extends React.ComponentProps<typeof MorphIconComponent> {
   iconClass?: string;
}

export const MorphIcon = ({
   iconClass = 'lucide',
   className,
   ...props
}: Props) => {
   const morphIconClass = clsx(iconClass, className);

   return <MorphIconComponent {...props} className={morphIconClass} />;
};
