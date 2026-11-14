import { BrowserRouter, Route, Routes } from 'react-router';
import { MasterDataPage } from './modules/core/MasterDataPage';
import { Layout } from './shared/Layout';
import { PageHeader, Placeholder } from './shared/ui';

function NotFound() {
  return (
    <>
      <PageHeader title="Seite nicht gefunden" />
      <p>Diese Seite gibt es nicht. Nutze die Navigation links.</p>
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route
            index
            element={
              <Placeholder
                title="Start"
                description="Hier erscheinen bald deine Aufgaben für heute und diese Woche sowie fällige Liefertermine der Teams."
              />
            }
          />
          <Route
            path="planung"
            element={
              <Placeholder
                title="Projektplanung"
                description="Anforderungen, Phasen je Team, Zeitleiste und Teamgespräch."
              />
            }
          />
          <Route
            path="aufgaben"
            element={
              <Placeholder
                title="Aufgaben"
                description="Wiederkehrende und einmalige PL-Aufgaben."
              />
            }
          />
          <Route
            path="risiken"
            element={
              <Placeholder
                title="Risiken"
                description="Risikoregister je Projekt mit geführtem Review."
              />
            }
          />
          <Route
            path="weiterentwicklung"
            element={
              <Placeholder
                title="Weiterentwicklung"
                description="Entwicklungsstand des PL-Cockpits, direkt aus dem Repository gelesen."
              />
            }
          />
          <Route path="stammdaten" element={<MasterDataPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
