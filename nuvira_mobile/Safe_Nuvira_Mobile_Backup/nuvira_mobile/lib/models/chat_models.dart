class ChatMessage {
  final String id;
  final String role;
  final String content;
  final DateTime timestamp;
  final List<String> sources;
  final String? attachmentName;
  String? feedback;
  bool animateTypewriter;

  ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
    this.sources = const [],
    this.attachmentName,
    this.feedback,
    this.animateTypewriter = false,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'role': role,
        'content': content,
        'timestamp': timestamp.toIso8601String(),
        'sources': sources,
        'attachmentName': attachmentName,
        'feedback': feedback,
      };

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        id: json['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
        role: json['role']?.toString() ?? 'assistant',
        content: json['content']?.toString() ?? '',
        timestamp: DateTime.tryParse(json['timestamp']?.toString() ?? '') ?? DateTime.now(),
        sources: (json['sources'] as List?)?.map((e) => e.toString()).toList() ?? [],
        attachmentName: json['attachmentName']?.toString(),
        feedback: json['feedback']?.toString(),
        animateTypewriter: false,
      );
}

class ChatSession {
  final String id;
  String title;
  final List<ChatMessage> messages;
  DateTime updatedAt;
  bool isPinned;

  ChatSession({
    required this.id,
    required this.title,
    required this.messages,
    required this.updatedAt,
    this.isPinned = false,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'messages': messages.map((m) => m.toJson()).toList(),
        'updatedAt': updatedAt.toIso8601String(),
        'isPinned': isPinned,
      };

  factory ChatSession.fromJson(Map<String, dynamic> json) => ChatSession(
        id: json['id']?.toString() ?? '',
        title: json['title']?.toString() ?? 'New Conversation',
        messages: (json['messages'] as List?)
                ?.map((m) => ChatMessage.fromJson(Map<String, dynamic>.from(m)))
                .toList() ??
            [],
        updatedAt: DateTime.tryParse(json['updatedAt']?.toString() ?? '') ?? DateTime.now(),
        isPinned: json['isPinned'] == true,
      );
}
