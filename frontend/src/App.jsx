import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './layouts/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import SingleDetect from './pages/SingleDetect'
import BatchDetect from './pages/BatchDetect'
import Algorithms from './pages/Algorithms'
import ModelComparison from './pages/ModelComparison'
import DatasetExplorer from './pages/DatasetExplorer'
import About from './pages/About'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/dashboard"       element={<Dashboard />} />
        <Route path="/detect"          element={<SingleDetect />} />
        <Route path="/batch"           element={<BatchDetect />} />
        <Route path="/algorithms"      element={<Algorithms />} />
        <Route path="/compare"         element={<ModelComparison />} />
        <Route path="/dataset"         element={<DatasetExplorer />} />
        <Route path="/about"           element={<About />} />
      </Route>
    </Routes>
  )
}
