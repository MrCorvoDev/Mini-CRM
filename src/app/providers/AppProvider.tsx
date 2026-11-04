import {ReactQueryProvider} from './ReactQueryProvider';
import {ReduxProvider} from './ReduxProvider';

export const AppProvider = ({children}: React.PropsWithChildren) => {
   return (
      <ReduxProvider>
         <ReactQueryProvider>{children}</ReactQueryProvider>
      </ReduxProvider>
   );
};
