/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from 'react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Layout } from './components/Layout';
import { DocsPage } from './pages/DocsPage';
import { EditDocPage } from './pages/EditDocPage';
import { LogsPage } from './components/LogsPage';

export default function App() {
  return (
    <TooltipProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path=":projectSlug/docs" element={<DocsPage />} />
          <Route path=":projectSlug/docs/edit" element={<EditDocPage />} />
          <Route path=":projectSlug/logs" element={
            <ProjectLogsWrapper />
          } />
        </Route>
      </Routes>
    </TooltipProvider>
  );
}

import { useParams } from 'react-router';
function ProjectLogsWrapper() {
  const { projectSlug } = useParams();
  return <LogsPage projectSlug={projectSlug!} />;
}
