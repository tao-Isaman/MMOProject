// Skill bar: ten slots bound to keys 1-9 and 0.

export const SLOT_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

// KeyboardEvent.code -> slot index (top row and numpad)
export function slotForCode(code) {
  const m = /^(?:Digit|Numpad)(\d)$/.exec(code);
  if (!m) return -1;
  return m[1] === "0" ? 9 : Number(m[1]) - 1;
}

export class SkillBar {
  constructor(root, skills, onUse) {
    this.slots = skills.map((skill, i) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = skill ? "slot" : "slot empty";
      el.setAttribute("aria-label", skill ? `${skill.name} (ปุ่ม ${SLOT_KEYS[i]})` : `ช่องว่าง ${SLOT_KEYS[i]}`);
      if (skill) {
        const img = document.createElement("img");
        img.src = skill.icon;
        img.alt = "";
        el.append(img);
      }
      const key = document.createElement("span");
      key.className = "key";
      key.textContent = SLOT_KEYS[i];
      const cd = document.createElement("span");
      cd.className = "cd";
      const cdText = document.createElement("span");
      cdText.className = "cdtext";
      el.append(key, cd, cdText);
      if (skill) {
        const tip = document.createElement("span");
        tip.className = "tooltip";
        tip.innerHTML = `<strong>${skill.name}</strong>${skill.description}`;
        el.append(tip);
      }
      el.addEventListener("click", () => {
        el.blur(); // keep keyboard focus on the game
        onUse(i);
      });
      root.append(el);
      return { el, cd, cdText };
    });
  }

  setCooldown(i, remaining, total) {
    const s = this.slots[i];
    const f = remaining > 0 ? remaining / total : 0;
    s.el.style.setProperty("--cd", f.toFixed(4));
    const text = remaining > 0 ? (remaining < 1 ? remaining.toFixed(1) : Math.ceil(remaining).toString()) : "";
    if (s.cdText.textContent !== text) s.cdText.textContent = text;
  }

  // Restart a one-shot CSS animation on a slot.
  pulse(i, cls) {
    const el = this.slots[i].el;
    el.classList.remove("flash", "denied");
    void el.offsetWidth;
    el.classList.add(cls);
  }
}
