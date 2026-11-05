import {AppProvider} from '@/app/providers';
import {unbounded} from '@/app/styles';
import '@/app/styles/global.scss';
import type {Metadata} from 'next';
import {ViewTransition} from 'react';

export const metadata: Metadata = {
   title: 'МиниCRM — Объекты и задачи',
   description: 'Система управления строительными объектами и задачами',
};

export default function RootLayout({children}: React.PropsWithChildren) {
   return (
      <ViewTransition>
         <html
            lang="ru"
            data-scroll-behavior="smooth"
            className={unbounded.variable}
         >
            <body>
               <AppProvider>
                  <div className="app">
                     <main className="content">{children}</main>
                  </div>
               </AppProvider>
            </body>
         </html>
      </ViewTransition>
   );
}
