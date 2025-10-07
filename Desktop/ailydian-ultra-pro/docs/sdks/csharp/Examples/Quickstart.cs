using System;
using System.Threading.Tasks;
using Lydian.SDK;
using Lydian.SDK.Models;

class Program
{
    static async Task Main(string[] args)
    {
        // Initialize client
        var client = new LydianClient(new LydianConfig
        {
            ApiKey = Environment.GetEnvironmentVariable("LYDIAN_API_KEY")
        });

        // Create a city
        var city = await client.SmartCities.CreateCityAsync(new City
        {
            Name = "San Francisco",
            Country = "USA",
            Population = 873965
        });

        Console.WriteLine($"City created: {city.Id}");
    }
}
