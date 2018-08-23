/* magphyxp.i */
 %module magphyxp
 %{
 /* Put header files here or function declarations like below */
 extern double period(double ptheta, double pphi, int num_events, double energy);
struct Minimum {
  double ptheta;
  double pphi;
  double f;
};

 extern Minimum calculate_min(double ptheta, double pphi, int num_events, double energy);
 %}
 
 extern double period(double ptheta, double pphi, int num_events, double energy);
struct Minimum {
  double ptheta;
  double pphi;
  double f;
};
 extern Minimum calculate_min(double ptheta, double pphi, int num_events, double energy);
