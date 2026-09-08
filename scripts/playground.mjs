const esc = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );

export function renderPlayground({ profile = {} } = {}) {
  return `<section class="playground-intro sr-only" aria-labelledby="playground-title"><p class="eyebrow">A SMALL CORNER OF THE INTERNET</p><h1 id="playground-title">A little bit of <em>everything.</em></h1><p>Things I’m building, learning, and moving around.</p></section>
  <section class="playground-section" aria-label="Interactive personal canvas">
    <div class="playground-topline"><p id="playground-instructions">Drag the cards. Make yourself at home.</p><button class="playground-view" type="button" data-playground-view aria-pressed="false" hidden>List view</button></div>
    <div class="playground-board" data-playground-board aria-describedby="playground-instructions">
      <div class="playground-world">
        <article class="playground-card playground-note" data-playground-card tabindex="0" aria-label="What I build card"><span class="playground-tape" aria-hidden="true"></span><p class="playground-small">A NOTE FROM ME</p><h2>Useful things,<br>a little <em>delight.</em></h2><p>Open-source tools. Thoughtful web experiences. Tests that catch the next broken workflow.</p><span class="playground-signature">— ${esc((profile.name || "Baivab Sarkar").split(" ")[0])}</span></article>
        <article class="playground-card playground-polaroid playground-portrait" data-playground-card tabindex="0" aria-label="Portrait card"><img src="/assets/profile/baivab-480.webp" alt="${esc(profile.name || "Baivab Sarkar")}" width="480" height="517" loading="lazy"><p>the person behind the code ↗</p></article>
        <article class="playground-card playground-clock" data-playground-card tabindex="0" aria-label="Local time in West Bengal card"><span class="playground-clock-face" aria-hidden="true"><i class="playground-clock-hour"></i><i class="playground-clock-minute"></i><b></b></span><p>West Bengal, India</p><time data-playground-time>UTC +05:30</time><small>Somewhere between ideas & commits.</small></article>
        <article class="playground-card playground-polaroid playground-work" data-playground-card tabindex="0" aria-label="Markdown Viewer project card"><img src="/assets/work/markdown-viewer-800.webp" alt="Markdown Viewer editor and rendered preview" width="800" height="450" loading="lazy"><p>a better place to write.</p><a href="/work/markdown-viewer">Open Markdown Viewer story <span aria-hidden="true">↗</span></a></article>
        <article class="playground-card playground-todo" data-playground-card tabindex="0" aria-label="Playground checklist card"><p class="playground-small">A TINY CHECKLIST</p><h2>While you’re here</h2><label><input type="checkbox" data-playground-check="explore"><span>Explore a project</span></label><label><input type="checkbox" data-playground-check="read"><span>Read something new</span></label><label><input type="checkbox" data-playground-check="hello"><span>Say hello</span></label><p class="playground-handwritten">small steps count, too.</p></article>
        <article class="playground-card playground-stack" data-playground-card tabindex="0" aria-label="Currently exploring card"><p class="playground-small">CURRENTLY EXPLORING</p><h2>Build. Test.<br>Repeat.</h2><div class="playground-code" aria-hidden="true">{ curious: true }</div><p>Java · JavaScript<br>Web development · Test automation</p><a href="/about">A little more about me ↗</a></article>
        <article class="playground-card playground-polaroid playground-medichain" data-playground-card tabindex="0" aria-label="MediChain project card"><img src="/assets/work/medichain-800.webp" alt="MediChain medicine traceability dashboard" width="800" height="450" loading="lazy"><p>from an idea to a prototype.</p><a href="/work/medichain">Explore MediChain <span aria-hidden="true">↗</span></a></article>
      </div>
      <div class="playground-palette" role="group" aria-label="Canvas background" hidden><button class="playground-swatch playground-swatch-blue" type="button" data-playground-color="blue" aria-label="Blue canvas" aria-pressed="true"></button><button class="playground-swatch playground-swatch-cream" type="button" data-playground-color="cream" aria-label="Cream canvas" aria-pressed="false"></button><button class="playground-swatch playground-swatch-green" type="button" data-playground-color="green" aria-label="Green canvas" aria-pressed="false"></button><button class="playground-swatch playground-swatch-lilac" type="button" data-playground-color="lilac" aria-label="Lilac canvas" aria-pressed="false"></button><button class="playground-swatch playground-swatch-pink" type="button" data-playground-color="pink" aria-label="Pink canvas" aria-pressed="false"></button></div>
      <div class="playground-controls" role="group" aria-label="Canvas controls" hidden><button type="button" data-playground-zoom="out" aria-label="Zoom out">−</button><output data-playground-zoom-label aria-label="Canvas zoom">100%</output><button type="button" data-playground-zoom="in" aria-label="Zoom in">+</button><button type="button" data-playground-reset aria-label="Reset canvas positions and zoom">↺</button></div>
    </div>
    <p class="playground-help">Focus a card and use the arrow keys to move it. Use List view for a simpler browse.</p><p class="sr-only" role="status" data-playground-status></p>
  </section>`;
}

export function renderInteractions() {
  return `<section class="playground-intro playground-interactions-intro" aria-labelledby="interactions-title"><nav class="view-switch" aria-label="Work views"><a href="/work">Work</a><a href="/interactions" aria-current="page">Interactions</a></nav><h1 id="interactions-title">Fun sidequests.</h1></section>
  <section class="playground-interactions" aria-label="Interaction experiments">
    <article class="playground-experiment"><div class="playground-experiment-stage playground-folder-stage"><button class="playground-demo-folder" type="button" aria-expanded="false" aria-controls="playground-folder-note"><span class="playground-folder-paper playground-folder-paper-one" aria-hidden="true">A tiny idea.</span><span class="playground-folder-paper playground-folder-paper-two" aria-hidden="true">A little care.</span><span class="playground-folder-front"><span aria-hidden="true">✳</span><strong>Good things inside</strong><small>CLICK TO OPEN</small></span></button><p id="playground-folder-note" class="playground-folder-message" hidden>Start small. Build something useful.</p></div><div class="playground-experiment-caption"><h2>The curious folder</h2><p>A small reveal, with a little spring.</p></div></article>
    <article class="playground-experiment"><div class="playground-experiment-stage playground-dot-demo"><div class="playground-dot-demo-highlight" aria-hidden="true"></div><p>Follow your <em>curiosity.</em></p><button class="playground-mini-button" type="button" data-playground-dot>Move the spotlight ↗</button></div><div class="playground-experiment-caption"><h2>Connect the dots</h2><p>Move your mouse or try the button.</p></div></article>
    <article class="playground-experiment"><div class="playground-experiment-stage playground-theme-demo"><span class="playground-theme-orbit" aria-hidden="true"></span><p data-playground-theme-caption>A brighter idea.</p><button class="playground-theme-button" type="button" aria-label="Dark mode for this experiment" aria-pressed="false"><span aria-hidden="true">☀</span></button></div><div class="playground-experiment-caption"><h2>A change of mood</h2><p>One click, a different atmosphere.</p></div></article>
    <article class="playground-experiment"><div class="playground-experiment-stage playground-type-demo"><p class="playground-type-sample">Hello,<br><em>world.</em></p><label for="playground-type-size">Make some room <output for="playground-type-size" data-playground-type-output>64 px</output></label><input type="range" id="playground-type-size" min="40" max="92" value="64" step="1"></div><div class="playground-experiment-caption"><h2>Room to express</h2><p>A little type, a lot of personality.</p></div></article>
  </section>`;
}
