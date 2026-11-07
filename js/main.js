// Raíz de composición: crea las piezas MVC y las conecta. Sin lógica de juego.
import { GameModel } from './model/GameModel.js';
import { GameView } from './view/GameView.js';
import { HudView } from './view/HudView.js';
import { PanelView } from './view/PanelView.js';
import { CastView } from './view/CastView.js';
import { InputView } from './view/InputView.js';
import { AudioView } from './view/AudioView.js';
import { ThemeView } from './view/ThemeView.js';
import { GameController } from './controller/GameController.js';

const model = new GameModel();
new CastView();

new GameController({
  model,
  views: {
    game: new GameView({ view: model.view }),
    hud: new HudView(),
    panels: new PanelView(),
    audio: new AudioView(),
    theme: new ThemeView(),
  },
  input: new InputView(),
}).init();
