import {ReactQueryProvider} from './ReactQueryProvider';

export const AppProvider = ({children}: React.PropsWithChildren) => {
   return <ReactQueryProvider>{children}</ReactQueryProvider>;
};
