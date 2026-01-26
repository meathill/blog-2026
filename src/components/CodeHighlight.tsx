'use client';

import { useEffect } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

export default function CodeHighlight() {
  useEffect(() => {
    hljs.highlightAll();
  }, []);

  return null;
}
