class ChatMessage {
  final String id;
  final String role;
  final String content;
  final DateTime timestamp;
  final List<String> sources;

  ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
    this.sources = const [],
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'role': role,
        'content': content,
        'timestamp': timestamp.toIso8601String(),
        'sources': sources,
      };

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      role: json['role'],
      content: json['content'],
      timestamp: DateTime.parse(json['timestamp']),
      sources: List<String>.from(json['sources'] ?? []),
    );
  }
}
