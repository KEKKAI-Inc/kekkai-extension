import {
  Route,
  RouterProvider,
  createMemoryRouter,
  createRoutesFromElements,
  createBrowserRouter
} from 'react-router-dom';
import React, { useMemo } from 'react';

import { IS_WEB } from '../utils/platform';
import { ROUTERS } from '../constants/routers';

import {
  LoadableDefend,
  LoadableSetting,
  LoadableWhitelist,
  LoadableReporting,
} from './loadable';
import { Layout } from '../layout';
import { Home } from '../components/home';

import './tailwind.css';

export const App = () => {
  const router = useMemo(() => (IS_WEB ? createBrowserRouter : createMemoryRouter)(
    createRoutesFromElements(
      <Route path='/' element={<Layout />}>
        <Route path='/' element={<Home />} />

        <Route path={ROUTERS.SETTING} element={<LoadableSetting />} />

        <Route path={ROUTERS.WHITELIST} element={<LoadableWhitelist />} />

        <Route path={ROUTERS.REPORTING} element={<LoadableReporting />} />

        <Route path={ROUTERS.TRANSACTION_PREVIEW} element={<LoadableDefend />} />
      </Route>
    ),
  ), []);

  return (
    <RouterProvider router={router} />
  );
};
