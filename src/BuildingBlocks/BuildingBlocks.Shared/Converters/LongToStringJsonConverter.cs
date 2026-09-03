using System;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BuildingBlocks.Shared.Converters;

public class LongToStringJsonConverter : JsonConverter<long>
{
    public override long Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return 0;
        }
        if (reader.TokenType == JsonTokenType.String)
        {
            var str = reader.GetString();
            if (string.IsNullOrWhiteSpace(str)) return 0;
            if (long.TryParse(str, out var value))
            {
                return value;
            }
            return 0;
        }
        if (reader.TokenType == JsonTokenType.Number)
        {
            return reader.GetInt64();
        }
        return 0;
    }

    public override void Write(Utf8JsonWriter writer, long value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString());
    }
}

public class NullableLongToStringJsonConverter : JsonConverter<long?>
{
    public override long? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }
        if (reader.TokenType == JsonTokenType.String)
        {
            var str = reader.GetString();
            if (string.IsNullOrWhiteSpace(str)) return null;
            if (long.TryParse(str, out var val)) return val;
        }
        if (reader.TokenType == JsonTokenType.Number)
        {
            return reader.GetInt64();
        }
        return null;
    }

    public override void Write(Utf8JsonWriter writer, long? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
        {
            writer.WriteStringValue(value.Value.ToString());
        }
        else
        {
            writer.WriteNullValue();
        }
    }
}

public class LongListToStringJsonConverter : JsonConverter<List<long>>
{
    public override List<long>? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        if (reader.TokenType != JsonTokenType.StartArray)
        {
            return new List<long>();
        }

        var list = new List<long>();
        while (reader.Read())
        {
            if (reader.TokenType == JsonTokenType.EndArray)
            {
                break;
            }

            if (reader.TokenType == JsonTokenType.String)
            {
                var str = reader.GetString();
                if (!string.IsNullOrWhiteSpace(str) && long.TryParse(str, out var val))
                {
                    list.Add(val);
                }
            }
            else if (reader.TokenType == JsonTokenType.Number)
            {
                list.Add(reader.GetInt64());
            }
        }

        return list;
    }

    public override void Write(Utf8JsonWriter writer, List<long> value, JsonSerializerOptions options)
    {
        if (value == null)
        {
            writer.WriteNullValue();
            return;
        }

        writer.WriteStartArray();
        foreach (var item in value)
        {
            writer.WriteStringValue(item.ToString());
        }
        writer.WriteEndArray();
    }
}
