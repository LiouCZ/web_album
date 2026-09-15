const form = document.querySelector("#vipForm");
const resultText = document.querySelector("#resultText");
const copyButton = document.querySelector("#copyButton");
const copyStatus = document.querySelector("#copyStatus");

const singleFields = ["称呼", "微信昵称", "微信号", "手机号", "VIP 等级", "预算区间", "款式描述", "其他备注"];
const multiFields = ["配件类", "主件类", "其他方向", "主题元素"];

function fieldValue(name) {
  const field = form.elements[name];
  if (!field) return "";

  if (field instanceof RadioNodeList) {
    const checked = [...field].find((item) => item.checked);
    return checked ? checked.value : "";
  }

  return String(field.value || "").trim();
}

function checkedValues(name) {
  return [...form.querySelectorAll(`input[name="${CSS.escape(name)}"]:checked`)].map((item) => item.value);
}

function line(label, value) {
  return `${label}：${value || "未填写"}`;
}

function buildResult() {
  const lines = ["BELONGS B&K VIP 定制意向登记", ""];

  for (const name of singleFields) {
    if (name === "款式描述" || name === "其他备注") continue;
    lines.push(line(name, fieldValue(name)));
  }

  lines.push("");
  for (const name of multiFields) {
    lines.push(line(name, checkedValues(name).join("、")));
  }

  lines.push("");
  lines.push(line("款式描述", fieldValue("款式描述")));
  lines.push(line("其他备注", fieldValue("其他备注")));

  return lines.join("\n");
}

function updateResult() {
  resultText.value = buildResult();
}

function enforceLimit(group, input) {
  const max = Number(group.dataset.max || 0);
  if (!max || !input.checked) return;

  const checked = [...group.querySelectorAll("input[type='checkbox']:checked")];
  if (checked.length <= max) return;

  input.checked = false;
  group.classList.remove("is-limited");
  void group.offsetWidth;
  group.classList.add("is-limited");
  copyStatus.textContent = `${group.querySelector("legend")?.textContent.trim() || "该项"}最多选择 ${max} 项`;
}

async function copyResult() {
  updateResult();
  resultText.select();

  try {
    await navigator.clipboard.writeText(resultText.value);
    copyStatus.textContent = "已复制登记内容";
  } catch {
    document.execCommand("copy");
    copyStatus.textContent = "已复制登记内容";
  }

  window.getSelection()?.removeAllRanges();
}

form.addEventListener("change", (event) => {
  const input = event.target.closest("input");
  if (!input) return;

  const group = input.closest(".choice-group");
  if (group) enforceLimit(group, input);
  updateResult();
});

form.addEventListener("input", updateResult);

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    copyStatus.textContent = "";
    updateResult();
  }, 0);
});

copyButton.addEventListener("click", copyResult);

updateResult();
