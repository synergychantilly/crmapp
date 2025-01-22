export const getTagColorClass = (tagName) => {
    const hash = Array.from(tagName).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = (hash % 6) + 1;
    return {
      class: `tag-color-${colorIndex}`,
      index: colorIndex
    };
  };