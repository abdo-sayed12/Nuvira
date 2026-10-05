import 'dart:convert';
import 'chat_message.dart';

class ChatSession {
  final String id;
  String title;
  List<ChatMessage> messages;
  bool isPinned;
  DateTime updatedAt;

  ChatSession({
    required this.id,
    required this.title,
    required this.messages,
    this.isPinned = false,
    required this.updatedAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'messages': messages.map((m) => m.toJson()).toList(),
      'isPinned': isPinned,
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory ChatSession.fromJson(Map<String, dynamic> json) {
    return ChatSession(
      id: json['id'],
      title: json['title'],
      messages: (json['messages'] as List).map((m) => ChatMessage.fromJson(m)).toList(),
      isPinned: json['isPinned'] ?? false,
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}
