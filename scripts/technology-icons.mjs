const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const brands = {
  JavaScript: 'javascript', Python: 'python', Solidity: 'solidity', Ethereum: 'ethereum',
  Cloudflare: 'cloudflare', Neutralinojs: 'neutralinojs', Playwright: 'playwright',
  Docker: 'docker', Spring: 'spring', Redis: 'redis', PostgreSQL: 'postgresql',
  LangChain: 'langchain', Streamlit: 'streamlit', Django: 'django', Selenium: 'selenium',
  MediaPipe: 'mediapipe', OpenCV: 'opencv', TensorFlow: 'tensorflow', Bootstrap: 'bootstrap',
  'Llama 2': 'meta', 'Web3.js': 'web3dotjs', 'scikit-learn': 'scikitlearn', MySQL: 'mysql',
};
const symbols = {
  IndexedDB: 'database', 'Browser Storage': 'database', localStorage: 'database',
  'Web development': 'globe', WebExtensions: 'panels-top-left', 'Canvas API': 'paintbrush',
  FAISS: 'database', Chainlit: 'messages-square', MetaMask: 'wallet', JPA: 'database',
  BeautifulSoup: 'code-xml',
};

export function technologyIcon(name) {
  if (name === 'HTML & CSS') return '<span class="tech-icon tech-icon-pair" aria-hidden="true"><img src="/assets/tools/html5.svg" alt="" width="20" height="20"><img src="/assets/tools/css3.svg" alt="" width="20" height="20"></span>';
  const brand = brands[name];
  const path = brand ? `/assets/tools/${brand}.svg` : `/assets/tools/lucide/${symbols[name] || 'code-xml'}.svg`;
  return `<span class="tech-icon${brand ? '' : ' tech-icon-symbol'}" aria-hidden="true"><img src="${path}" alt="" width="24" height="24" loading="lazy" decoding="async"></span>`;
}

export function technologyList(stack) {
  return `<ul class="technology-list" aria-label="Technologies">${stack.map((name) => `<li>${technologyIcon(name)}<span>${escape(name)}</span></li>`).join('')}</ul>`;
}
