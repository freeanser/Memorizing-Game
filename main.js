const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatched: "CardsMatched",
  CardsMatchedFailed: "CardsMatchedFailed",
  GameFinished: "GameFinished"
};

const symbols = [
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png", // 0 黑桃花色
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png", //1 紅心花色
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png", //2 方塊花色
  "https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png" //3 梅花花色
];
//  0 - 12: 0黑桃 1-13
// 13 - 25: 1紅心 1-13
// 26 - 38: 2方塊 1-13
// 39 - 51: 3梅花 1-13

const model = {
  revealedCards: [],
  isRevealedCardsMatched() {
    return (
      this.revealedCards[0].dataset.index % 13 ===
      this.revealedCards[1].dataset.index % 13
    );
  },
  score: 0,
  triedTimes: 0
};

const view = {
  transformNumber(number) {
    switch (number) {
      case 1:
        return "A";
      case 11:
        return "J";
      case 12:
        return "Q";
      case 13:
        return "K";
      default:
        return number;
    }
  },
  getCardsFront(index) {
    const symbol = symbols[Math.floor(index / 13)];
    const number = this.transformNumber((index % 13) + 1);
    return `<p>${number}</p>
      <img src="${symbol}" alt="">
      <p>${number}</p>`;
  },
  getCardsBack(index) {
    return ` <div data-index='${index}' class="card back"></div>`;
  },
  renderCards(indexes) {
    const rootElement = document.querySelector("#cards");
    // rootElement.innerHTML = this.getCardsBack(0); // 自己嘗試跑跑看, 下一步是要自動產生數字並把數字放進去
    // const renderNumber = utility.getRandomNumberArray(52); // 0 - 52的陣列
    // 為什麼這邊不能用 forEach?
    const putNumberInCards = indexes.map((index) => this.getCardsBack(index)); // 把生成的卡片變成陣列
    rootElement.innerHTML = putNumberInCards.join(""); // 把陣列用 '' 包在一起，變成innerHTML
  },
  flipCards(...cards) {
    cards.map((card) => {
      // 背面翻回正面
      if (card.classList.contains("back")) {
        card.classList.remove("back");
        let index = Number(card.dataset.index);
        card.innerHTML = this.getCardsFront(index);
        return;
      } else {
        // 正面翻回背面
        card.classList.add("back");
        card.innerHTML = null;
      }
    });
  },
  // 用 ... 展開值，儲存成 array
  pairCards(...cards) {
    cards.map((card) => {
      card.classList.add("paired");
    });
  },
  renderScore(score) {
    document.querySelector(".score").textContent = `score: ${score}`;
  },
  renderTriedTimes(times) {
    document.querySelector(
      ".tried"
    ).textContent = `You've tried: ${times} times`;
  },
  appendWrongAnimation(...cards) {
    cards.map((card) => {
      // 加上wrong標籤
      card.classList.add("wrong");
      // click 事件在元素被點擊時觸發，而 animationend 事件在元素的 CSS 動畫[結束]時觸發
      card.addEventListener(
        "animationend",
        (event) => event.target.classList.remove("wrong"),
        { once: true }
      );
    });
  },
  showGameFinished() {
    const completed = document.createElement("div");
    completed.classList.add("completed");
    completed.innerHTML = `
<p>Complete!</p>
  <p>Score:</p>
  <p>You've tried: times</p>
`;
    const header = document.querySelector("#header");
    header.before(completed);
  }
};

const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  generateCards() {
    view.renderCards(utility.getRandomNumberArray(52));
    return;
  },
  resetCards() {
    // 用 ... 把資料展開成 array
    view.flipCards(...model.revealedCards);
    // 2. model 資料儲存
    model.revealedCards = [];
    // 3. state改變 // 要用 controller.currentState，因為 resetCards 在 setTimeout的地方，要當作參數使用;使用 this.currentState，this會指向 setTimeout
    controller.currentState = GAME_STATE.FirstCardAwaits;
  },
  // 翻牌機制：1.view外型改變 2. model 資料儲存 3. state改變
  dispatchCardAction(card) {
    // 正部 （已經翻開）=>沒有變化
    if (!card.classList.contains("back")) {
      return;
    }
    // 背面＝> 要翻開
    // 1. 翻第一張 2. 翻第二張
    // switch(關注這裡){case如果...：就要執行}
    switch (this.currentState) {
      // 1. 翻第一張
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card); //1.view外型改變 // 此處不用 ... 展開，因為此處只有一張card要被 翻開flip
        model.revealedCards.push(card); // 2. model 資料儲存
        this.currentState = GAME_STATE.SecondCardAwaits; // 3. state改變
        break;

      // 2. 翻第二張
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes);
        view.flipCards(card); // 此處不用 ... 展開，因為此處只有一張card要被 翻開flip
        model.revealedCards.push(card);
        //  配對正確或失敗 if
        if (model.isRevealedCardsMatched()) {
          // true: 配對成功
          view.renderScore((model.score += 10));
          this.currentState = GAME_STATE.CardsMatched;
          // 1.view外型改變
          view.pairCards(...model.revealedCards);
          // 2. model 資料儲存
          model.revealedCards = [];

          // 如果配對過關，遊戲完成
          if (model.score === 260) {
            this.currentState = GAME_STATE.GameFinished;
            view.showGameFinished();
            return; // 迴圈結束
          }
          // 3. state改變
          this.currentState = GAME_STATE.FirstCardAwaits;
        } else {
          // 否則就是配對失敗
          // state先改變，以免setTimeout等待時間，玩家持續塞入cards
          this.currentState = GAME_STATE.CardsMatchedFailed;
          // view外型改變
          view.appendWrongAnimation(...model.revealedCards);
          // setTimeout(functionRef, delay)
          setTimeout(this.resetCards, 1000); // 停留1000毫秒後，執行function, 不是執行function的結果 （function）
        }
        break;
    }
    console.log("this.currentState:", this.currentState);
    console.log("model.revealedCards:", model.revealedCards);
    console.log(
      "model.isRevealedCardsMatched:",
      model.isRevealedCardsMatched()
    );
  }
};

// 洗牌工具
const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys()); // [0,1,2,3,4]
    for (let index = number.length - 1; index > 0; index--) {
      // index = 1,2,3,4
      let randomIndex = Math.floor(Math.random() * (index + 1)); // randomIndex = 0,1,2,3,4
      [number[index], number[randomIndex]] = [
        number[randomIndex],
        number[index]
      ];
    }
    return number;
  }
};

controller.generateCards();

// Node Lise (Array-Like)
// 用forEach個別監聽和改變
document.querySelectorAll(".card").forEach((card) => {
  card.addEventListener("click", (event) => {
    controller.dispatchCardAction(card);
  });
});
