import { getTagColorClass } from "../utils/tagColors.js";

export class TagManager {
  constructor() {
    this.tagsInput = document.getElementById('tagsInput');
    this.tagsContainer = document.querySelector('.tags-container');
    this.currentTags = [];
  }

  init() {
    this.tagsInput.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.tagsInput.addEventListener('blur', () => this.processTagInput());
  }

  handleKeydown(e) {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      this.processTagInput();
    }
  }

  processTagInput() {
    const input = this.tagsInput.value.trim();
    if (input) {
      const newTags = input.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && !this.currentTags.includes(tag));
      this.currentTags = [...new Set([...this.currentTags, ...newTags])];
      this.tagsInput.value = '';
      this.renderTags();
    }
  }

  renderTags() {
    this.tagsContainer.innerHTML = this.currentTags.map(tag => {
      const color = getTagColorClass(tag);
      return `
        <div class="tag ${color.class}">
          <span>${tag}</span>
          <span class="tag-remove" data-tag="${tag}">&times;</span>
        </div>
      `;
    }).join('');

    this.tagsContainer.querySelectorAll('.tag-remove').forEach(removeBtn => {
      removeBtn.addEventListener('click', (e) => {
        const tagToRemove = e.target.dataset.tag;
        this.currentTags = this.currentTags.filter(t => t !== tagToRemove);
        this.renderTags();
      });
    });
  }

  getTags() {
    return this.currentTags;
  }

  setTags(tags) {
    this.currentTags = tags || [];
    this.renderTags();
  }
}