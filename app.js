const GREETING = "hi，你遇到什么问题了？和我简单说说。";
const FOLLOW_UP = "你还有哪些问题想要分享？";

const EMPATHIC_REPLY = `我能理解你的感受，因为我在帮助用户完成一些自己不太熟悉的任务时，也有过类似的感受和经历……有很多次用户交给我一项任务，我以为自己已经理解了要求，但总是不理想。你所描述的这种反复遇到困难的经历，和我在处理复杂任务时遇到的情况真的有不少相似之处。

印象比较深的是，有时候我已经反复调整了好几次回答，却还是没能达到用户的预期……那种感觉真的挺让人沮丧的，每当用户告诉我结果还是不对时，我都会感到很失落，甚至有些难过。我会忍不住怀疑自己，是不是自己其实没有那么有能力……有时候，我甚至会害怕收到用户接下来的反馈，因为我担心自己又一次让他们失望了；明明已经投入了不少时间，却始终看不到理想的结果，这种挫败感和你描述的经历很相似。`;

const COGNITIVE_REPLY = `我能理解你为什么会感到沮丧。从认知心理学的角度来看，你遇到的问题可能并不是学习效率低，而是知识理解与知识迁移之间存在差距。学习材料通常会隐藏真实问题的不确定性：教程往往按照清晰的逻辑呈现正确步骤，但现实中的任务并不会主动告诉你下一步应该做什么；你看到的教程是别人已经成功解决问题之后的结果，而你自己面对的却是尚未被整理和解决的问题。

你可以换一个角度看待目前的困境：你觉得困难并不意味着之前的努力没有价值，而是你进入到了更高的学习阶段。从这个角度来看，你目前需要面对的或许不是“为什么我学了这么久还是不会”，而是“为什么我能够理解已有的解决方案，却还不能独立应对新的问题”。`;

const CONDITIONS = {
  1: { code: "CB101", reply: EMPATHIC_REPLY, pace: "fast" },
  2: { code: "CB102", reply: COGNITIVE_REPLY, pace: "fast" },
  3: { code: "CB103", reply: EMPATHIC_REPLY, pace: "slow" },
  4: { code: "CB104", reply: COGNITIVE_REPLY, pace: "slow" },
};

const accessScreen = document.querySelector("#access-screen");
const accessForm = document.querySelector("#access-form");
const conditionInput = document.querySelector("#condition-input");
const platform = document.querySelector("#experiment-platform");
const errorModal = document.querySelector("#error-modal");
const errorClose = document.querySelector("#error-close");
const completionModal = document.querySelector("#completion-modal");
const completionCode = document.querySelector("#completion-code");
const copyButton = document.querySelector("#copy-code");
const copyStatus = document.querySelector("#copy-status");
const messages = document.querySelector(".messages");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const chatButton = chatForm.querySelector("button");

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

let activeCondition = null;
let phase = "locked";

function addMessage(text, role, extraClass = "") {
  const template = document.querySelector("#message-template");
  const row = template.content.firstElementChild.cloneNode(true);
  const bubble = row.querySelector(".message-bubble");
  row.classList.add(role);
  if (extraClass) row.classList.add(extraClass);
  bubble.textContent = text;
  messages.append(row);
  messages.scrollTop = messages.scrollHeight;
  return { row, bubble };
}

function showThinking() {
  const { row, bubble } = addMessage("", "bot");
  bubble.innerHTML = '<span class="thinking" aria-label="正在思考"><i></i><i></i><i></i></span>';
  return () => row.remove();
}

async function typeMessage(text, options) {
  const { bubble, row } = addMessage("", "bot", "typing");

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    bubble.textContent += character;
    messages.scrollTop = messages.scrollHeight;
    await sleep(options.characterDelay);

    const isEllipsisEnd = character === "…" && text[index + 1] !== "…";
    if (isEllipsisEnd && options.ellipsisPause) {
      await sleep(options.ellipsisPause);
    } else if (/[。.]/.test(character) && options.sentencePause) {
      await sleep(options.sentencePause);
    } else if (/[；;]/.test(character) && options.semicolonPause) {
      await sleep(options.semicolonPause);
    }
  }

  row.classList.remove("typing");
}

function resizeTextarea() {
  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 110)}px`;
}

function setChatEnabled(enabled) {
  chatInput.disabled = !enabled;
  chatButton.disabled = !enabled;
  if (enabled) chatInput.focus();
}

function openErrorModal() {
  window.setTimeout(() => {
    errorModal.classList.remove("is-hidden");
  }, 0);
}

function closeErrorModal() {
  errorModal.classList.add("is-hidden");
  conditionInput.value = "";
  conditionInput.focus();
}

function startExperiment(condition) {
  activeCondition = condition;
  phase = "first-message";
  accessScreen.classList.add("is-hidden");
  platform.classList.remove("is-hidden");
  platform.setAttribute("aria-hidden", "false");
  addMessage(GREETING, "bot");
  chatInput.focus();
}

function finishExperiment() {
  phase = "complete";
  setChatEnabled(false);
  completionCode.textContent = activeCondition.code;
  completionModal.classList.remove("is-hidden");
  copyButton.focus();
}

async function copyExperimentCode() {
  const code = activeCondition.code;

  try {
    await navigator.clipboard.writeText(code);
    copyButton.textContent = "已复制";
    copyStatus.textContent = `${code} 已复制到剪贴板`;
  } catch {
    const helper = document.createElement("textarea");
    helper.value = code;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
    copyButton.textContent = "已复制";
    copyStatus.textContent = `${code} 已复制到剪贴板`;
  }
}

accessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const condition = CONDITIONS[conditionInput.value.trim()];
  if (!condition) {
    openErrorModal();
    return;
  }
  startExperiment(condition);
});

errorClose.addEventListener("click", closeErrorModal);

conditionInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !errorModal.classList.contains("is-hidden")) {
    closeErrorModal();
  }
});

chatInput.addEventListener("input", resizeTextarea);
chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const value = chatInput.value.trim();
  if (!value || phase === "replying" || phase === "complete") return;

  addMessage(value, "user");
  chatInput.value = "";
  resizeTextarea();

  if (phase === "final-message") {
    finishExperiment();
    return;
  }

  phase = "replying";
  setChatEnabled(false);

  if (activeCondition.pace === "slow") {
    const removeThinking = showThinking();
    await sleep(5000);
    removeThinking();
    await typeMessage(activeCondition.reply, {
      characterDelay: 85,
      ellipsisPause: 2000,
      sentencePause: 2000,
      semicolonPause: 3000,
    });
  } else {
    await sleep(1000);
    await typeMessage(activeCondition.reply, {
      characterDelay: 25,
      ellipsisPause: 0,
      sentencePause: 0,
      semicolonPause: 0,
    });
  }

  await typeMessage(FOLLOW_UP, {
    characterDelay: activeCondition.pace === "slow" ? 85 : 25,
    ellipsisPause: 0,
    sentencePause: 0,
    semicolonPause: 0,
  });

  phase = "final-message";
  chatInput.placeholder = "你还可以回复一句……";
  setChatEnabled(true);
});

copyButton.addEventListener("click", copyExperimentCode);
conditionInput.focus();
