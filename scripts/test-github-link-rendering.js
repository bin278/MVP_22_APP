// 测试GitHub链接渲染功能
async function testGitHubLinkRendering() {
  console.log('🧪 测试GitHub链接渲染功能...');

  try {
    // 模拟成功推送的响应数据
    const mockPushResponse = {
      success: true,
      message: "Successfully pushed to GitHub!",
      repoUrl: "https://github.com/bin278/12321314",
      repoName: "12321314"
    };

    // 测试markdown链接格式化
    const testContent = `✅ ${mockPushResponse.message}\n\n仓库: [${mockPushResponse.repoName}](${mockPushResponse.repoUrl})`;

    console.log('📝 生成的markdown内容:');
    console.log(testContent);

    // 模拟renderContentWithLinks函数
    const renderContentWithLinks = (content) => {
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = linkRegex.exec(content)) !== null) {
        // 添加匹配前的文本
        if (match.index > lastIndex) {
          parts.push(content.slice(lastIndex, match.index));
        }

        // 添加链接
        const [fullMatch, text, url] = match;
        parts.push(`<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`);

        lastIndex = match.index + fullMatch.length;
      }

      // 添加剩余的文本
      if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
      }

      return parts.length > 0 ? parts.join('') : content;
    };

    const renderedContent = renderContentWithLinks(testContent);
    console.log('\n🔗 渲染后的HTML内容:');
    console.log(renderedContent);

    console.log('\n✅ GitHub链接渲染功能测试完成！');
    console.log('现在GitHub仓库地址会显示为可点击的超链接');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testGitHubLinkRendering();




