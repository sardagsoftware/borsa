import com.lydian.sdk.LydianClient;
import com.lydian.sdk.models.City;

public class Quickstart {
    public static void main(String[] args) {
        // Initialize client
        LydianClient client = new LydianClient.Builder()
                .apiKey(System.getenv("LYDIAN_API_KEY"))
                .build();

        try {
            // Create a city
            City city = new City();
            city.setName("San Francisco");
            city.setCountry("USA");
            city.setPopulation(873965);

            City created = client.smartCities.createCity(city);
            System.out.println("City created: " + created.getId());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
