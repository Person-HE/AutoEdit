import json

# 读取JSON文件并移除开头的注释
def read_json_with_comments(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 移除注释行
    json_lines = []
    for line in lines:
        stripped_line = line.strip()
        if not stripped_line.startswith('//'):
            json_lines.append(line)
    
    # 组合成完整的JSON字符串并解析
    json_str = ''.join(json_lines)
    return json.loads(json_str)

# 递归分析JSON结构
def analyze_json_structure(data, indent=0):
    prefix = '  ' * indent
    
    if isinstance(data, dict):
        print(f"{prefix}{{")
        for key, value in data.items():
            print(f"{prefix}  '{key}':", end=' ')
            if isinstance(value, (dict, list)):
                print()
                analyze_json_structure(value, indent + 2)
            else:
                print(f"{type(value).__name__}", end='')
                if isinstance(value, str) and len(value) > 50:
                    print(f" (长度: {len(value)})")
                else:
                    print()
        print(f"{prefix}}}")
    
    elif isinstance(data, list):
        print(f"{prefix}[")
        if len(data) > 0:
            print(f"{prefix}  # 包含 {len(data)} 个元素")
            if isinstance(data[0], (dict, list)):
                print(f"{prefix}  # 第一个元素结构:")
                analyze_json_structure(data[0], indent + 2)
            else:
                print(f"{prefix}  # 元素类型: {type(data[0]).__name__}")
        else:
            print(f"{prefix}  # 空列表")
        print(f"{prefix}]")
    
    else:
        print(f"{prefix}{type(data).__name__}")

# 分析具体字段含义
def analyze_json_fields(data):
    print("\n=== 详细字段分析 ===")
    print("\n1. canvas_config: 画布配置")
    print("   - height: 画布高度 (1080)")
    print("   - ratio: 画布比例 ('16:9')")
    print("   - width: 画布宽度 (1920)")
    
    print("\n2. color_space: 色彩空间 (0)")
    
    print("\n3. config: 项目配置")
    print("   - adjust_max_index: 调整工具最大索引 (1)")
    print("   - attachment_info: 附件信息 (空列表)")
    print("   - combination_max_index: 组合最大索引 (1)")
    print("   - export_range: 导出范围 (null)")
    print("   - extract_audio_last_index: 提取音频最后索引 (1)")
    print("   - lyrics_recognition_id: 歌词识别ID ('')")
    print("   - lyrics_sync: 歌词同步 (true)")
    print("   - lyrics_taskinfo: 歌词任务信息 (空列表)")
    print("   - maintrack_adsorb: 主轨道吸附 (true)")
    print("   - material_save_mode: 素材保存模式 (0)")
    print("   - multi_language_current: 当前多语言 ('none')")
    print("   - multi_language_list: 多语言列表 (空列表)")
    print("   - multi_language_main: 主要多语言 ('none')")
    print("   - multi_language_mode: 多语言模式 ('none')")
    print("   - original_sound_last_index: 原始声音最后索引 (1)")
    print("   - record_audio_last_index: 录音最后索引 (1)")
    print("   - sticker_max_index: 贴纸最大索引 (1)")
    print("   - subtitle_keywords_config: 字幕关键词配置 (null)")
    print("   - subtitle_recognition_id: 字幕识别ID ('')")
    print("   - subtitle_sync: 字幕同步 (true)")
    print("   - subtitle_taskinfo: 字幕任务信息 (空列表)")
    print("   - system_font_list: 系统字体列表 (空列表)")
    print("   - video_mute: 视频静音 (false)")
    print("   - zoom_info_params: 缩放信息参数 (null)")
    
    print("\n4. cover: 封面 (null)")
    print("5. create_time: 创建时间 (0)")
    print("6. duration: 项目时长 (44766666 微秒，约44.77秒)")
    print("7. extra_info: 额外信息 (null)")
    print("8. fps: 帧率 (30.0)")
    print("9. free_render_index_mode_on: 自由渲染索引模式 (false)")
    print("10. group_container: 组容器 (null)")
    print(f"11. id: 项目ID ('{data.get('id', 'N/A')}')")
    print("12. keyframe_graph_list: 关键帧图表列表 (空列表)")
    
    print("\n13. keyframes: 关键帧")
    print("    - adjusts: 调整关键帧 (空列表)")
    print("    - audios: 音频关键帧 (空列表)")
    print("    - effects: 特效关键帧 (空列表)")
    print("    - filters: 滤镜关键帧 (空列表)")
    print("    - handwrites: 手写关键帧 (空列表)")
    print("    - stickers: 贴纸关键帧 (空列表)")
    print("    - texts: 文字关键帧 (空列表)")
    print("    - videos: 视频关键帧 (空列表)")
    
    print("\n14. last_modified_platform: 最后修改平台")
    if 'last_modified_platform' in data:
        platform = data['last_modified_platform']
        print(f"    - app_id: 应用ID ({platform.get('app_id', 'N/A')})")
        print(f"    - app_source: 应用来源 ('{platform.get('app_source', 'N/A')}')")
        print(f"    - app_version: 应用版本 ('{platform.get('app_version', 'N/A')}')")
        print(f"    - device_id: 设备ID ('{platform.get('device_id', 'N/A')}')")
        print(f"    - hard_disk_id: 硬盘ID ('{platform.get('hard_disk_id', 'N/A')}')")
        print(f"    - mac_address: MAC地址 ('{platform.get('mac_address', 'N/A')}')")
        print(f"    - os: 操作系统 ('{platform.get('os', 'N/A')}')")
        print(f"    - os_version: 操作系统版本 ('{platform.get('os_version', 'N/A')}')")
    
    print("\n15. materials: 素材")
    print("    - ai_translates: AI翻译 (空列表)")
    print("    - audio_balances: 音频平衡 (空列表)")
    print("    - audio_effects: 音频特效 (空列表)")
    print("    - audio_fades: 音频淡入淡出")
    print("    - audio_track_indexes: 音轨索引 (空列表)")
    print("    - audios: 音频素材")
    print("    - texts: 文字素材")
    print("    - videos: 视频素材")
    
    print("\n16. tracks: 轨道")
    print("    - 包含音频轨道和视频轨道")
    
    print("\n17. update_time: 更新时间 (0)")
    print("18. version: 版本 (360000)")

# 主函数
if __name__ == "__main__":
    # 读取并解析JSON数据
    data = read_json_with_comments('jianying_draft.json')
    
    print("=== JSON结构分析 ===")
    analyze_json_structure(data)
    
    analyze_json_fields(data)
