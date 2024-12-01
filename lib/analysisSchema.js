export const jsonSchema = {
  type: "object",
  properties: {
    customer_analysis: {
      type: "object",
      properties: {
        sentiment: {
          type: "string",
          enum: ["positive", "negative", "neutral", "mixed"]
        },
        issues: {
          type: "array",
          items: {
            type: "string"
          }
        },
        pain_points: {
          type: "array",
          items: {
            type: "string"
          }
        },
        urgency_level: {
          type: "string",
          enum: ["low", "medium", "high", "critical"]
        }
      },
      required: ["sentiment", "issues", "pain_points", "urgency_level"],
      additionalProperties: false
    },
    agent_performance: {
      type: "object",
      properties: {
        response_quality: {
          type: "object",
          properties: {
            score: {
              type: "number",
              description: "Score from 1-10"
            },
            notes: {
              type: "array",
              items: {
                type: "string"
              }
            }
          },
          required: ["score", "notes"],
          additionalProperties: false
        },
        empathy_score: {
          type: "number",
          description: "Score from 1-10"
        },
        solution_effectiveness: {
          type: "string",
          enum: ["ineffective", "partially_effective", "effective", "highly_effective", "not_applicable"]
        },
        improvement_areas: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: ["response_quality", "empathy_score", "solution_effectiveness", "improvement_areas"],
      additionalProperties: false
    },
    interaction_quality: {
      type: "object",
      properties: {
        resolution_status: {
          type: "string",
          enum: ["not_started", "in_progress", "resolved", "escalated", "requires_follow_up"]
        },
        compliance_issues: {
          type: "array",
          items: {
            type: "string"
          }
        },
        escalation_indicators: {
          type: "array",
          items: {
            type: "string"
          }
        },
        customer_satisfaction_indicators: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: ["resolution_status", "compliance_issues", "escalation_indicators", "customer_satisfaction_indicators"],
      additionalProperties: false
    },
    business_intelligence: {
      type: "object",
      properties: {
        product_feedback: {
          type: "array",
          items: {
            type: "string"
          }
        },
        process_improvements: {
          type: "array",
          items: {
            type: "string"
          }
        },
        system_issues: {
          type: "array",
          items: {
            type: "string"
          }
        },
        training_opportunities: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: ["product_feedback", "process_improvements", "system_issues", "training_opportunities"],
      additionalProperties: false
    }
  },
  required: ["customer_analysis", "agent_performance", "interaction_quality", "business_intelligence"],
  additionalProperties: false
};
