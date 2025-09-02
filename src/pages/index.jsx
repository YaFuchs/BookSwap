import Layout from "./Layout.jsx";

import BookCatalog from "./BookCatalog";

import BookFair from "./BookFair";

import ContentManagerSettings from "./ContentManagerSettings";

import FAQ from "./FAQ";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    BookCatalog: BookCatalog,
    
    BookFair: BookFair,
    
    ContentManagerSettings: ContentManagerSettings,
    
    FAQ: FAQ,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<BookCatalog />} />
                
                
                <Route path="/BookCatalog" element={<BookCatalog />} />
                
                <Route path="/BookFair" element={<BookFair />} />
                
                <Route path="/ContentManagerSettings" element={<ContentManagerSettings />} />
                
                <Route path="/FAQ" element={<FAQ />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}